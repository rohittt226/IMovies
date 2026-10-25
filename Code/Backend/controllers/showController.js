const mongoose = require("mongoose");
const Show = require("../models/Show");

const Movie = require("../models/Movie");
const Theatre = require("../models/Theatre");


const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({
        message: "Invalid movie ID",
      });
    }

    const shows = await Show.find({
      movie: movieId,
      showTime: { $gte: new Date() },
    })
      .populate("theatre", "name city address")
      .sort({ showTime: 1 });

    res.status(200).json(shows);

  } catch (error) {
    console.error("Show Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch shows",
    });
  }
};


const getShowById = async (req, res) => {
  try {
    const { showId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({
        message: "Invalid show ID",
      });
    }

   const show = await Show.findById(showId)
  .populate("movie", "title poster")
  .populate("theatre", "name city address accessibleSeats");

    if (!show) {
      return res.status(404).json({
        message: "Show not found",
      });
    }

    res.status(200).json(show);
  } catch (error) {
    console.error("Show Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch show",
    });
  }
};


const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate("movie", "title poster")
      .populate("theatre", "name city")
      .sort({ showTime: 1 });

    res.status(200).json(shows);
  } catch (error) {
    console.error("Get Shows Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch shows",
    });
  }
};


const addShow = async (req, res) => {
  try {
    const {
      movie,
      theatre,
      showTime,
      price,
      totalSeats,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(movie) ||
      !mongoose.Types.ObjectId.isValid(theatre)
    ) {
      return res.status(400).json({
        message: "Invalid movie or theatre ID",
      });
    }

    const parsedDate = new Date(showTime);
    const ticketPrice = Number(price);
    const seats = Number(totalSeats);

    if (
      !showTime ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate <= new Date() ||
      !Number.isFinite(ticketPrice) ||
      ticketPrice <= 0 ||
      !Number.isInteger(seats) ||
      seats <= 0
    ) {
      return res.status(400).json({
        message: "Enter valid future show time, price and seats",
      });
    }

    const [movieExists, theatreExists] = await Promise.all([
      Movie.exists({ _id: movie }),
      Theatre.exists({ _id: theatre }),
    ]);

    if (!movieExists || !theatreExists) {
      return res.status(404).json({
        message: "Movie or theatre not found",
      });
    }

    const show = await Show.create({
      movie,
      theatre,
      showTime: parsedDate,
      price: ticketPrice,
      totalSeats: seats,
      bookedSeats: [],
    });

    res.status(201).json({
      message: "Show added successfully",
      show,
    });
  } catch (error) {
    console.error("Add Show Error:", error.message);

    res.status(500).json({
      message: "Failed to add show",
    });
  }
};


const updateShow = async (req, res) => {
  try {
    const { showId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({
        message: "Invalid show ID",
      });
    }

    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({
        message: "Show not found",
      });
    }

    const Booking = require("../models/Booking");

    const existingBooking = await Booking.exists({
      show: showId,
    });

    if (existingBooking) {
      return res.status(409).json({
        message: "Cannot edit a show with existing bookings",
      });
    }

    const { movie, theatre, showTime, price, totalSeats } = req.body;

    if (
      movie === undefined &&
      theatre === undefined &&
      showTime === undefined &&
      price === undefined &&
      totalSeats === undefined
    ) {
      return res.status(400).json({
        message: "No fields to update",
      });
    }

    if (movie !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(movie) ||
          !(await Movie.exists({ _id: movie }))) {
        return res.status(400).json({ message: "Invalid movie" });
      }
      show.movie = movie;
    }

    if (theatre !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(theatre) ||
          !(await Theatre.exists({ _id: theatre }))) {
        return res.status(400).json({ message: "Invalid theatre" });
      }
      show.theatre = theatre;
    }

    if (showTime !== undefined) {
      const date = new Date(showTime);

      if (Number.isNaN(date.getTime()) || date <= new Date()) {
        return res.status(400).json({
          message: "Show time must be a valid future date",
        });
      }

      show.showTime = date;
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          message: "Invalid ticket price",
        });
      }

      show.price = parsedPrice;
    }

    if (totalSeats !== undefined) {
      const seats = Number(totalSeats);

      if (!Number.isInteger(seats) || seats <= 0) {
        return res.status(400).json({
          message: "Invalid total seats",
        });
      }

      show.totalSeats = seats;
    }

    await show.save();

    res.status(200).json({
      message: "Show updated successfully",
      show,
    });
  } catch (error) {
    console.error("Update Show Error:", error.message);

    res.status(500).json({
      message: "Failed to update show",
    });
  }
};


const deleteShow = async (req, res) => {
  try {
    const { showId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({
        message: "Invalid show ID",
      });
    }

    const Booking = require("../models/Booking");

    const existingBooking = await Booking.exists({
      show: showId,
    });

    if (existingBooking) {
      return res.status(409).json({
        message: "Cannot delete a show with existing bookings",
      });
    }

    const show = await Show.findByIdAndDelete(showId);

    if (!show) {
      return res.status(404).json({
        message: "Show not found",
      });
    }

    res.status(200).json({
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error("Delete Show Error:", error.message);

    res.status(500).json({
      message: "Failed to delete show",
    });
  }
};

module.exports = {
  getShowsByMovie,
  getShowById,
  getAllShows,
  addShow,
  updateShow,
  deleteShow,
};