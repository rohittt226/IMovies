const Movie = require("../models/Movie");
const Show = require("../models/Show");
const mongoose = require("mongoose");


const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch movies",
    });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    res.status(200).json(movie);
  } catch (error) {
    res.status(400).json({
      message: "Invalid movie ID",
    });
  }
};



const addMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      language,
      duration,
      rating,
      poster,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isFinite(Number(duration)) ||
      Number(duration) <= 0 ||
      !Number.isFinite(Number(rating)) ||
      Number(rating) < 0 ||
      Number(rating) > 10
    ) {
      return res.status(400).json({
        message: "Enter a valid title, duration and rating (0-10)",
      });
    }

    const movie = await Movie.create({
      title: title.trim(),
      description,
      genre,
      language,
      duration: Number(duration),
      rating: Number(rating),
      poster,
    });

    res.status(201).json({
      message: "Movie added successfully",
      movie,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to add movie",
    });
  }
};

const updateMovie = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "genre",
      "language",
      "duration",
      "rating",
      "poster",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided",
      });
    }

    if (
      ("title" in updates &&
        (typeof updates.title !== "string" || !updates.title.trim())) ||
      ("duration" in updates &&
        (!Number.isFinite(Number(updates.duration)) ||
          Number(updates.duration) <= 0)) ||
      ("rating" in updates &&
        (!Number.isFinite(Number(updates.rating)) ||
          Number(updates.rating) < 0 ||
          Number(updates.rating) > 10))
    ) {
      return res.status(400).json({
        message: "Invalid movie details",
      });
    }

    if ("title" in updates) {
      updates.title = updates.title.trim();
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    res.json({
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    console.error(error);

    res.status(error.name === "CastError" ? 400 : 500).json({
      message: "Failed to update movie",
    });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const movieId = req.params.id;

    
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

    
    const existingShow = await Show.exists({
      movie: movieId,
    });

    if (existingShow) {
      return res.status(409).json({
        message:
          "Cannot delete this movie because shows are associated with it.",
      });
    }

    
    await Movie.findByIdAndDelete(movieId);

    res.status(200).json({
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error("Delete movie error:", error);

    res.status(500).json({
      message: "Failed to delete movie",
    });
  }
};

module.exports = {
  getMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
};