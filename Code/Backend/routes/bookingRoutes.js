const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createBooking,
  getMyBookings,
} = require("../controllers/bookingController");

router.post("/", protect, createBooking);

router.get("/my", protect, getMyBookings);

module.exports = router;