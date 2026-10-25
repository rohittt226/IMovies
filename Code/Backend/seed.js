require("dotenv").config();

const mongoose = require("mongoose");
const Movie = require("./models/Movie");

const movies = [
  {
    title: "Avengers",
    description: "Earth's mightiest heroes unite.",
    genre: "Action",
    language: "English",
    duration: 180,
    rating: 8.5,
  },
  {
    title: "Interstellar",
    description: "Explorers travel through space.",
    genre: "Sci-Fi",
    language: "English",
    duration: 169,
    rating: 8.7,
  },
  {
    title: "Inception",
    description: "A thief enters people's dreams.",
    genre: "Thriller",
    language: "English",
    duration: 148,
    rating: 8.8,
  },
];

async function seedMovies() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const movie of movies) {
      await Movie.updateOne(
        { title: movie.title },
        { $set: movie },
        { upsert: true }
      );
    }

    console.log("Sample movies added successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedMovies();