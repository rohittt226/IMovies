const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  genre: String,
  language: String,
  duration: Number,
  rating: Number,
  poster: String,
});

module.exports = mongoose.model("Movie", movieSchema);