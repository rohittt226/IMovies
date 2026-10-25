const mongoose = require("mongoose");

const User = require("../models/User");
const Movie = require("../models/Movie");


const addToWatchlist = async (req, res) => {
  try {
    const { movieId } = req.body;

    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({
        message: "Invalid movie ID",
      });
    }

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { watchlist: movieId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie added to watchlist",
    });
  } catch (error) {
    console.error("Add Watchlist Error:", error.message);

    return res.status(500).json({
      message: "Failed to add movie to watchlist",
    });
  }
};


const getMyWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("watchlist", "title poster genre language rating");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      watchlist: (user.watchlist || []).filter(Boolean),
    });
  } catch (error) {
    console.error("Get Watchlist Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch watchlist",
    });
  }
};


const removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({
        message: "Invalid movie ID",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchlist: movieId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie removed from watchlist",
    });
  } catch (error) {
    console.error("Remove Watchlist Error:", error.message);

    return res.status(500).json({
      message: "Failed to remove movie from watchlist",
    });
  }
};

module.exports = {
  addToWatchlist,
  getMyWatchlist,
  removeFromWatchlist,
};