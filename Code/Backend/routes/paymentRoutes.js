const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getPendingBookings,
} = require("../controllers/paymentController");


router.post("/create-order", protect, createPaymentOrder);


router.post("/verify", protect, verifyPayment);


router.get("/status/:orderId", protect, getPaymentStatus);

router.get("/pending-bookings", protect, getPendingBookings);

module.exports = router;