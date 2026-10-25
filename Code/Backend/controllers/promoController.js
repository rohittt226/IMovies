const mongoose = require("mongoose");
const Show = require("../models/Show");
const { calculatePromoDiscount } = require("../utils/promoUtils");

const validatePromo = async (req, res) => {
  try {
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
        message: "Invalid ticket amount",
      });
    }

    const result = calculatePromoDiscount(
      originalAmount,
      promoCode
    );

    return res.status(200).json({
      success: true,
      ...result,
      currency: "INR",
    });
  } catch (error) {
    if (
      error.message === "Invalid promo code" ||
      error.message === "Invalid original amount"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Promo Validation Error:", error.message);

    return res.status(500).json({
      message: "Failed to validate promo code",
    });
  }
};

module.exports = { validatePromo };