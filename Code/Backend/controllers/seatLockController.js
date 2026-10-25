const mongoose = require("mongoose");
const SeatLock = require("../models/SeatLock");
const Show = require("../models/Show");

const LOCK_DURATION = 5 * 60 * 1000;
const PAYMENT_RESERVATION_DURATION = 10 * 60 * 1000;

const lockSeats = async (req, res) => {
  const { showId, seats } = req.body;

  
  if (!mongoose.isValidObjectId(showId)) {
    return res.status(400).json({
      message: "Invalid show ID",
    });
  }

  if (
    !Array.isArray(seats) ||
    seats.length === 0 ||
    seats.some((seat) => typeof seat !== "string") ||
    new Set(seats).size !== seats.length
  ) {
    return res.status(400).json({
      message: "Invalid seat selection",
    });
  }

  const session = await mongoose.startSession();

  try {
    let expiresAt;

    await session.withTransaction(async () => {
      const show = await Show.findById(showId).session(session);

      if (!show) {
        const error = new Error("Show not found");
        error.status = 404;
        throw error;
      }

      if (new Date(show.showTime) <= new Date()) {
        const error = new Error("This show has already started");
        error.status = 400;
        throw error;
      }

      const validSeats = Array.from(
        { length: show.totalSeats },
        (_, index) => `S${index + 1}`
      );

      if (seats.some((seat) => !validSeats.includes(seat))) {
        const error = new Error("Invalid seat number");
        error.status = 400;
        throw error;
      }

      if (seats.some((seat) => show.bookedSeats.includes(seat))) {
        const error = new Error("One or more seats are already booked");
        error.status = 409;
        throw error;
      }

      const now = new Date();

      
      await SeatLock.deleteMany({
        show: showId,
        seat: { $in: seats },
        expiresAt: { $lte: now },
      }).session(session);

      const activeLocks = await SeatLock.find({
        show: showId,
        seat: { $in: seats },
        expiresAt: { $gt: now },
      }).session(session);

      
      const lockedByOthers = activeLocks.some(
        (lock) => lock.user.toString() !== req.user._id.toString()
      );

      
const hasActivePaymentReservation = activeLocks.some(
  (lock) =>
    lock.user.toString() === req.user._id.toString() &&
    lock.reservationStatus === "payment"
);

if (hasActivePaymentReservation) {
  const error = new Error(
    "Payment is already in progress for these seats. Please complete or resolve the existing payment before selecting them again."
  );

  error.status = 409;
  throw error;
}

      if (lockedByOthers) {
        const error = new Error(
          "One or more seats are temporarily locked by another user"
        );
        error.status = 409;
        throw error;
      }

      expiresAt = new Date(Date.now() + LOCK_DURATION);

      
      await SeatLock.deleteMany({
        show: showId,
        seat: { $in: seats },
        user: req.user._id,
      }).session(session);

      
      await SeatLock.insertMany(
        seats.map((seat) => ({
          show: showId,
          seat,
          user: req.user._id,
          expiresAt,
        })),
        { session }
      );
    });

    const io = req.app.get("io");

if (io) {
  io.to(`show_${showId}`).emit("seatsUpdated", {
    showId,
    action: "locked",
    seats,
    expiresAt,
  });
}
    res.status(201).json({
      message: "Seats locked successfully for 5 minutes",
      expiresAt,
    });
  } catch (error) {
    console.error("Seat Lock Error:", error.message);

    res.status(error.status || (error.code === 11000 ? 409 : 500)).json({
      message:
        error.code === 11000
          ? "One or more seats are already locked"
          : error.status
          ? error.message
          : "Failed to lock seats",
    });
  } finally {
    await session.endSession();
  }
};


const releaseSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;

    if (
      !mongoose.isValidObjectId(showId) ||
      !Array.isArray(seats) ||
      seats.length === 0 ||
      seats.some((seat) => typeof seat !== "string") ||
      new Set(seats).size !== seats.length
    ) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    
    const result = await SeatLock.deleteMany({
      show: showId,
      seat: { $in: seats },
      user: req.user._id,
      reservationStatus: { $in: ["selection", null] },
    });

    
    if (result.deletedCount > 0) {
      const io = req.app.get("io");

      if (io) {
        io.to(`show_${showId}`).emit("seatsUpdated", {
          showId: String(showId),
          action: "refresh",
        });
      }
    }

    return res.status(200).json({
      message:
        "Normal seat locks released. Active payment reservations are protected.",
    });
  } catch (error) {
    console.error("Release Seats Error:", error.message);

    return res.status(500).json({
      message: "Failed to release seats",
    });
  }
};
const getLockedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({
        message: "Invalid show ID",
      });
    }

    const locks = await SeatLock.find({
      show: showId,
      expiresAt: { $gt: new Date() },
    }).select("seat expiresAt -_id");

    return res.status(200).json({
      lockedSeats: locks.map((lock) => ({
        seat: lock.seat,
        expiresAt: lock.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Get Locked Seats Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch locked seats",
    });
  }
};

module.exports = {
  lockSeats,
  releaseSeats,
  getLockedSeats,
};