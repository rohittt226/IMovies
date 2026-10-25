const express = require("express");

const router = express.Router();

const {
  addReview,
  getMovieReviews,
  getAllReviews,
  deleteReview,
} = require("../controllers/reviewController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


router.get("/movie/:movieId", getMovieReviews);


router.get("/admin", protect, adminOnly, getAllReviews);


router.delete(
  "/admin/:reviewId",
  protect,
  adminOnly,
  deleteReview
);


router.post("/", protect, addReview);

module.exports = router;