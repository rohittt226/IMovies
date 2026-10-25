const mongoose = require("mongoose");
const Review = require("../models/Review");
const Movie = require("../models/Movie");


const addReview = async (req, res) => {
  try {
    const { movieId, rating, comment } = req.body;

    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({
        message: "Invalid movie ID",
      });
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    if (
      typeof comment !== "string" ||
      comment.trim().length < 3 ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Review must contain 3 to 1000 characters",
      });
    }

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      movie: movieId,
    });

    if (existingReview) {
      return res.status(409).json({
        message: "You have already reviewed this movie",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      movie: movieId,
      rating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this movie",
      });
    }

    console.error("Add Review Error:", error.message);

    return res.status(500).json({
      message: "Failed to submit review",
    });
  }
};


const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({
        message: "Invalid movie ID",
      });
    }

    const reviews = await Review.find({ movie: movieId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : 0;

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error) {
    console.error("Get Reviews Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch reviews",
    });
  }
};


const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("user", "name email")
      .populate("movie", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get All Reviews Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch reviews",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete Review Error:", error.message);

    return res.status(500).json({
      message: "Failed to delete review",
    });
  }
};

module.exports = {
  addReview,
  getMovieReviews,
  getAllReviews,
  deleteReview,
};