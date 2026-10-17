const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("IMovies Backend is Running Successfully!");
});

const PORT = process.env.PORT || 5000;


const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();