const mongoose = require("mongoose");

const seatLockSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    seat: {
      type: String,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
    paymentOrderId: {
  type: String,
  default: null,
},

reservationStatus: {
  type: String,
  enum: ["selection", "payment"],
  default: "selection",
},
  },
  { timestamps: true }
);


seatLockSchema.index(
  { show: 1, seat: 1 },
  { unique: true }
);


seatLockSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("SeatLock", seatLockSchema);