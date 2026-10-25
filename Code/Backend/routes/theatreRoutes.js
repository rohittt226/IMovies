const express = require("express");

const router = express.Router();

const {
  getTheatres,
  addTheatre,
  updateTheatre,
  deleteTheatre,
} = require("../controllers/theatreController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


router.get("/", getTheatres);


router.post("/", protect, adminOnly, addTheatre);
router.put("/:id", protect, adminOnly, updateTheatre);
router.delete("/:id", protect, adminOnly, deleteTheatre);

module.exports = router;