const mongoose = require("mongoose");
const Theatre = require("../models/Theatre");
const Show = require("../models/Show");

const validateAccessibleSeats = (seats) => {
  return (
    Array.isArray(seats) &&
    seats.every(
      (seat) =>
        typeof seat === "string" &&
        /^S[1-9]\d*$/.test(seat)
    ) &&
    new Set(seats).size === seats.length
  );
};


const getTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find().sort({ name: 1 });
    res.status(200).json(theatres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch theatres" });
  }
};


const addTheatre = async (req, res) => {
  try {
    const { name, city, address, accessibleSeats = [] } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof city !== "string" ||
      !city.trim() ||
      (address !== undefined && typeof address !== "string")
    ) {
      return res.status(400).json({
        message: "Valid theatre name and city are required",
      });
    }

    if (!validateAccessibleSeats(accessibleSeats)) {
  return res.status(400).json({
    message: "Invalid accessible seats",
  });
}

    const theatre = await Theatre.create({
  name: name.trim(),
  city: city.trim(),
  address: address?.trim() || "",
  accessibleSeats,
});

    res.status(201).json({
      message: "Theatre added successfully",
      theatre,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add theatre" });
  }
};

const updateTheatre = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid theatre ID" });
    }

    const { name, city, address, accessibleSeats } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Invalid theatre name" });
      }
      updates.name = name.trim();
    }

    if (city !== undefined) {
      if (typeof city !== "string" || !city.trim()) {
        return res.status(400).json({ message: "Invalid city" });
      }
      updates.city = city.trim();
    }

    if (address !== undefined) {
      if (typeof address !== "string") {
        return res.status(400).json({ message: "Invalid address" });
      }
      updates.address = address.trim();
    }

    if (accessibleSeats !== undefined) {
  if (!validateAccessibleSeats(accessibleSeats)) {
    return res.status(400).json({
      message: "Invalid accessible seats",
    });
  }

  updates.accessibleSeats = accessibleSeats;
}

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const theatre = await Theatre.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!theatre) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    res.status(200).json({
      message: "Theatre updated successfully",
      theatre,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update theatre" });
  }
};


const deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid theatre ID" });
    }

    const theatre = await Theatre.findById(id);

    if (!theatre) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    const linkedShow = await Show.exists({ theatre: id });

    if (linkedShow) {
      return res.status(409).json({
        message: "Cannot delete theatre because shows are linked to it",
      });
    }

    await Theatre.findByIdAndDelete(id);

    res.status(200).json({
      message: "Theatre deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete theatre" });
  }
};

module.exports = {
  getTheatres,
  addTheatre,
  updateTheatre,
  deleteTheatre,
};