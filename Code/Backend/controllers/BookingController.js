const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Show = require("../models/Show");
const SeatLock = require("../models/SeatLock");
const Payment = require("../models/Payment");
const { calculatePromoDiscount } = require("../utils/promoUtils");


const createBooking = async (req, res) => {
  const { paymentId } = req.body;

  if (!mongoose.isValidObjectId(paymentId)) {
    return res.status(400).json({
      message: "Valid payment ID is required",
    });
  }

  let session;

  try {
    session = await mongoose.startSession();

    let booking;
    let showId;
    let seats;

    await session.withTransaction(async () => {
      const now = new Date();

      
      const payment = await Payment.findOne({
        _id: paymentId,
        user: req.user._id,
      }).session(session);

      if (!payment) {
        throw Object.assign(
          new Error("Payment not found"),
          { status: 404 }
        );
      }

      if (payment.status !== "paid" || !payment.razorpayPaymentId) {
        throw Object.assign(
          new Error("Payment has not been verified"),
          { status: 403 }
        );
      }

  
      if (payment.booking) {
        throw Object.assign(
          new Error("Booking already exists for this payment"),
          { status: 409 }
        );
      }

      showId = payment.show;
      seats = payment.seats;

      const show = await Show.findById(showId).session(session);

      if (!show) {
        throw Object.assign(
          new Error("Show not found"),
          { status: 404 }
        );
      }

      if (new Date(show.showTime) <= now) {
        throw Object.assign(
          new Error("This show has already started"),
          { status: 400 }
        );
      }

      const validSeats = Array.from(
        { length: show.totalSeats },
        (_, index) => `S${index + 1}`
      );

      if (
        !Array.isArray(seats) ||
        seats.length === 0 ||
        new Set(seats).size !== seats.length ||
        seats.some((seat) => !validSeats.includes(seat))
      ) {
        throw Object.assign(
          new Error("Invalid seat selection"),
          { status: 400 }
        );
      }

      if (seats.some((seat) => show.bookedSeats.includes(seat))) {
        throw Object.assign(
          new Error("Selected seats are already booked"),
          { status: 409 }
        );
      }

      
      

const activeLocks = await SeatLock.find({
  show: showId,
  seat: { $in: seats },
  expiresAt: { $gt: now },
}).session(session);

const conflictingLocks = activeLocks.some(
  (lock) =>
    String(lock.user) !== String(req.user._id) ||
    (
      lock.reservationStatus === "payment" &&
      lock.paymentOrderId !== payment.razorpayOrderId
    )
);

if (conflictingLocks) {
  throw Object.assign(
    new Error(
      "One or more seats are reserved for another payment. Booking cannot be recovered automatically."
    ),
    { status: 409 }
  );
}
      
      
const currentOriginalAmount = Math.round(
  seats.length * show.price * 100
);


const hasPromoSnapshot =
  payment.originalAmount !== undefined &&
  payment.originalAmount !== null;

const originalAmount = hasPromoSnapshot
  ? payment.originalAmount
  : currentOriginalAmount;


if (
  !Number.isSafeInteger(originalAmount) ||
  originalAmount < 100 ||
  originalAmount !== currentOriginalAmount
) {
  throw Object.assign(
    new Error("Original payment amount mismatch"),
    { status: 409 }
  );
}

let promoDetails;

try {
  promoDetails = calculatePromoDiscount(
    originalAmount,
    payment.promoCode || null
  );
} catch (error) {
  console.error("PROMO BOOKING ERROR:", {
    message: error.message,
    originalAmount,
    promoCode: payment.promoCode,
    discountAmount: payment.discountAmount,
    paymentAmount: payment.amount,
  });

  throw Object.assign(
    new Error("Invalid promo information"),
    { status: 409 }
  );
}


const savedDiscount = hasPromoSnapshot
  ? payment.discountAmount
  : 0;

if (
  payment.amount !== promoDetails.finalAmount ||
  savedDiscount !== promoDetails.discountAmount ||
  payment.currency !== "INR"
) {
  throw Object.assign(
    new Error("Payment amount mismatch"),
    { status: 409 }
  );
}
      
      const updatedShow = await Show.findOneAndUpdate(
        {
          _id: showId,
          bookedSeats: { $nin: seats },
          showTime: { $gt: now },
        },
        {
          $addToSet: {
            bookedSeats: { $each: seats },
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedShow) {
        throw Object.assign(
          new Error("Seats are no longer available"),
          { status: 409 }
        );
      }

      
      const bookings = await Booking.create(
        [
          {
            user: req.user._id,
            show: showId,
            seats,
            totalAmount: payment.amount / 100,
            status: "confirmed",
            paymentStatus: "paid",
            paymentMethod: "razorpay",
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: payment.razorpayPaymentId,
          },
        ],
        { session }
      );

      booking = bookings[0];

      
      payment.booking = booking._id;
payment.bookingStatus = "confirmed";

await payment.save({ session });

      
      await SeatLock.deleteMany({
        show: showId,
        seat: { $in: seats },
        user: req.user._id,
      }).session(session);
    });

    
    const io = req.app.get("io");

    if (io) {
      io.to(`show_${showId}`).emit("seatsUpdated", {
        showId: String(showId),
        action: "booked",
        seats,
      });
    }

    return res.status(201).json({
      message: "Payment verified and booking confirmed!",
      booking,
    });

  } catch (error) {
  console.error("Booking Error:", error.message);

  
  try {
    if (
      mongoose.isValidObjectId(paymentId) &&
      [400, 409].includes(error.status)
    ) {
      await Payment.updateOne(
        {
          _id: paymentId,
          user: req.user._id,
          status: "paid",
          booking: null,
          bookingStatus: { $ne: "confirmed" },
        },
        {
          $set: {
            bookingStatus: "needs_resolution",
          },
        }
      );
    }
  } catch (trackingError) {
    console.error(
      "Payment Resolution Tracking Error:",
      trackingError.message
    );
  }

  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : "Booking failed. Please try again.",
  });

  } finally {
    if (session) {
      await session.endSession();
    }
  }
};



const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
    })
      .populate({
        path: "show",
        populate: [
          { path: "movie", select: "title poster" },
          { path: "theatre", select: "name city" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {
    console.error("My Bookings Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
};