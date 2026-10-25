require("dotenv").config();

const mongoose = require("mongoose");
const Movie = require("./models/Movie");
const Theatre = require("./models/Theatre");
const Show = require("./models/Show");

async function seedShows() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const movies = await Movie.find();

    if (movies.length === 0) {
      console.log("No movies found. Run node seed.js first.");
      return;
    }

    const theatre = await Theatre.findOneAndUpdate(
      { name: "IMovies Cinema", city: "Indore" },
      {
        name: "IMovies Cinema",
        city: "Indore",
        address: "Vijay Nagar",
      },
      { upsert: true, new: true }
    );

    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    for (const movie of movies) {
      const existingShow = await Show.findOne({
        movie: movie._id,
        theatre: theatre._id,
        showTime: { $gte: new Date() },
      });

      if (!existingShow) {
        await Show.create({
          movie: movie._id,
          theatre: theatre._id,
          showTime: tomorrow,
          price: 200,
          totalSeats: 50,
          bookedSeats: [],
        });
      }
    }

    console.log("Sample theatre and shows added successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedShows();