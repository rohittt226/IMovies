const Razorpay = require("razorpay");
const Show = require("../models/Show");
const SeatLock = require("../models/SeatLock");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const { calculatePromoDiscount } = require("../utils/promoUtils");
const crypto = require("crypto");
const PAYMENT_RESERVATION_DURATION = 10 * 60 * 1000;


const createPaymentOrder = async (req, res) => {
  const { showId, seats, promoCode } = req.body;

  if (
    !mongoose.isValidObjectId(showId) ||
    !Array.isArray(seats) ||
    seats.length === 0 ||
    seats.some((seat) => typeof seat !== "string") ||
    new Set(seats).size !== seats.length
  ) {
    return res.status(400).json({
      message: "Invalid show or seat selection",
    });
  }

  let session;

  try {
    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({
        message: "Show not found",
      });
    }

    if (new Date(show.showTime) <= new Date()) {
      return res.status(400).json({
        message: "This show has already started",
      });
    }

    const validSeats = new Set(
      Array.from(
        { length: show.totalSeats },
        (_, index) => `S${index + 1}`
      )
    );

    if (
      seats.some(
        (seat) =>
          !validSeats.has(seat) ||
          show.bookedSeats.includes(seat)
      )
    ) {
      return res.status(409).json({
        message: "One or more seats are unavailable",
      });
    }

    const originalAmount = Math.round(
  seats.length * show.price * 100
);

if (
  !Number.isSafeInteger(originalAmount) ||
  originalAmount < 100
) {
  return res.status(400).json({
    message: "Invalid payment amount",
  });
}

let promoDetails;

try {
  promoDetails = calculatePromoDiscount(
    originalAmount,
    promoCode
  );
} catch (error) {
  return res.status(400).json({
    message: error.message,
  });
}

const amount = promoDetails.finalAmount;

    const now = new Date();

    const locks = await SeatLock.find({
      show: showId,
      seat: { $in: seats },
      user: req.user._id,
      expiresAt: { $gt: now },
      reservationStatus: { $in: ["selection", null] },
    });

    if (locks.length !== seats.length) {
      return res.status(409).json({
        message:
          "Seat lock expired or payment already in progress. Please check your booking.",
      });
    }

    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `imovies_${Date.now()}`,
    });

    let reservationExpiresAt;
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const transactionNow = new Date();

    
      const currentShow = await Show.findById(showId).session(session);

      if (
        !currentShow ||
        new Date(currentShow.showTime) <= transactionNow ||
        seats.some((seat) => currentShow.bookedSeats.includes(seat))
      ) {
        const error = new Error(
          "Selected seats are no longer available"
        );
        error.status = 409;
        throw error;
      }

      
      const currentLocks = await SeatLock.find({
        show: showId,
        seat: { $in: seats },
        user: req.user._id,
        expiresAt: { $gt: transactionNow },
        reservationStatus: { $in: ["selection", null] },
      }).session(session);

      if (currentLocks.length !== seats.length) {
        const error = new Error(
          "Seat lock expired or payment reservation already exists"
        );
        error.status = 409;
        throw error;
      }

      reservationExpiresAt = new Date(
  Date.now() + PAYMENT_RESERVATION_DURATION
);

      const lockUpdate = await SeatLock.updateMany(
        {
          show: showId,
          seat: { $in: seats },
          user: req.user._id,
          expiresAt: { $gt: transactionNow },
          reservationStatus: { $in: ["selection", null] },
        },
        {
          $set: {
            expiresAt: reservationExpiresAt,
            reservationStatus: "payment",
            paymentOrderId: order.id,
          },
        },
        { session }
      );

      if (lockUpdate.matchedCount !== seats.length) {
        const error = new Error(
          "Unable to reserve all selected seats"
        );
        error.status = 409;
        throw error;
      }

      
      await Payment.create(
        [
          {
            user: req.user._id,
            show: showId,
            seats,
            amount: order.amount,
            originalAmount,
            promoCode: promoDetails.promoCode,
            discountAmount: promoDetails.discountAmount,
            currency: order.currency,
            razorpayOrderId: order.id,
            status: "created",
            bookingStatus: "pending",
          },
        ],
        { session }
      );
    });

    return res.status(201).json({
  orderId: order.id,
  amount: order.amount,
  originalAmount,
  discountAmount: promoDetails.discountAmount,
  promoCode: promoDetails.promoCode,
  currency: order.currency,
  keyId: process.env.RAZORPAY_KEY_ID,
  reservationExpiresAt,
});
  } catch (error) {
    console.error("Create Payment Order Error:", error.message);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Failed to create payment order",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid payment details",
      });
    }

    
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment order not found",
      });
    }

    
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${payment.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    const expected = Buffer.from(generatedSignature, "hex");
    const received = Buffer.from(razorpay_signature, "hex");

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(400).json({
        message: "Payment signature verification failed",
      });
    }

    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      razorpayPayment.order_id !== payment.razorpayOrderId ||
      razorpayPayment.status !== "captured" ||
      razorpayPayment.amount !== payment.amount ||
      razorpayPayment.currency !== payment.currency
    ) {
      return res.status(400).json({
        message: "Payment is not captured or details do not match",
      });
    }

    
    if (
      payment.razorpayPaymentId &&
      payment.razorpayPaymentId !== razorpay_payment_id
    ) {
      return res.status(409).json({
        message: "Order already linked to another payment",
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "paid";

    await payment.save();

    return res.status(200).json({
      message: "Payment verified successfully",
      paymentId: payment._id,
      status: payment.status,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error.message);

    return res.status(500).json({
      message: "Payment verification failed",
    });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (
      typeof orderId !== "string" ||
      !/^order_[a-zA-Z0-9]+$/.test(orderId)
    ) {
      return res.status(400).json({
        message: "Invalid Razorpay order ID",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: orderId,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment order not found",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

  
    const result = await razorpay.orders.fetchPayments(orderId);

    const payments = result.items || [];

    const capturedPayment = payments.find(
      (item) =>
        item.status === "captured" &&
        item.order_id === orderId &&
        item.amount === payment.amount &&
        item.currency === payment.currency
    );

    if (capturedPayment) {
      
      if (
        payment.razorpayPaymentId &&
        payment.razorpayPaymentId !== capturedPayment.id
      ) {
        return res.status(409).json({
          message: "Payment requires manual review",
        });
      }

      payment.status = "paid";
      payment.razorpayPaymentId = capturedPayment.id;

      await payment.save();
    }

    
    if (payment.status === "paid" && !payment.booking) {
      const activeLocks = await SeatLock.countDocuments({
        show: payment.show,
        seat: { $in: payment.seats },
        user: req.user._id,
        reservationStatus: "payment",
        paymentOrderId: payment.razorpayOrderId,
        expiresAt: { $gt: new Date() },
      });

      if (activeLocks !== payment.seats.length) {
        payment.bookingStatus = "needs_resolution";
        await payment.save();
      }
    }

    return res.status(200).json({
      orderId: payment.razorpayOrderId,
      status: payment.status,
      bookingStatus: payment.bookingStatus,
      paymentId: payment.status === "paid" ? payment._id : null,
      bookingId: payment.booking || null,
    });
  } catch (error) {
    console.error("Get Payment Status Error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve payment status",
    });
  }
};

const getPendingBookings = async (req, res) => {
  try {
    const payments = await Payment.find({
      user: req.user._id,
      status: "paid",
      booking: null,
    })
      .select("_id show seats amount bookingStatus createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Pending Bookings Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch pending bookings",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getPendingBookings,
};