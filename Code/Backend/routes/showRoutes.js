const express = require("express");

const router = express.Router();

const {
  getShowsByMovie,
  getShowById,
  getAllShows,
  addShow,
  updateShow,
  deleteShow,
} = require("../controllers/showController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


router.get("/movie/:movieId", getShowsByMovie);
router.get("/:showId", getShowById);


router.get("/", protect, adminOnly, getAllShows);
router.post("/", protect, adminOnly, addShow);
router.put("/:showId", protect, adminOnly, updateShow);
router.delete("/:showId", protect, adminOnly, deleteShow);

module.exports = router;