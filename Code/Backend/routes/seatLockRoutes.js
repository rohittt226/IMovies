const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  lockSeats,
  releaseSeats,
  getLockedSeats,
} = require("../controllers/seatLockController");

router.post("/lock", protect, lockSeats);
router.post("/release", protect, releaseSeats);
router.get("/show/:showId", getLockedSeats);

module.exports = router;