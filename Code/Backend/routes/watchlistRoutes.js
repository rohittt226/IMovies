const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  addToWatchlist,
  getMyWatchlist,
  removeFromWatchlist,
} = require("../controllers/watchlistController");


router.use(protect);


router.get("/", getMyWatchlist);


router.post("/", addToWatchlist);


router.delete("/:movieId", removeFromWatchlist);

module.exports = router;