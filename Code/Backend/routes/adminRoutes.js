const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const User = require("../models/User");
const Payment = require("../models/Payment");

const router = express.Router();


router.use(protect, adminOnly);


router.get("/dashboard", (req, res) => {
  res.status(200).json({
    message: "Welcome to IMovies Admin Dashboard",
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});


router.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Fetch Users Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});


router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find({})
      .select(
        "user show seats amount currency status booking bookingStatus createdAt"
      )
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const summary = {
      totalPayments: payments.length,
      successfulPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalRevenue: 0,
      unresolvedPayments: 0,
    };

    for (const payment of payments) {
      if (payment.status === "paid") {
        summary.successfulPayments++;

        
        if (payment.currency === "INR") {
          summary.totalRevenue += payment.amount;
        }

        if (
          !payment.booking ||
          payment.bookingStatus !== "confirmed"
        ) {
          summary.unresolvedPayments++;
        }
      } else if (payment.status === "created") {
        summary.pendingPayments++;
      } else if (payment.status === "failed") {
        summary.failedPayments++;
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        ...summary,
        totalRevenue: summary.totalRevenue / 100,
      },
      payments: payments.map((payment) => ({
        ...payment,
        amount: payment.amount / 100,
      })),
    });
  } catch (error) {
    console.error("Admin Payments Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment records",
    });
  }
});

module.exports = router;