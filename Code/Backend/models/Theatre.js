const mongoose = require("mongoose");

const theatreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },

  address: String,

  accessibleSeats: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Theatre", theatreSchema);