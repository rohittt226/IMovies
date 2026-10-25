const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    seats: {
      type: [String],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
    
originalAmount: {
  type: Number,
  min: 0,
},


promoCode: {
  type: String,
  default: null,
  trim: true,
  uppercase: true,
},


discountAmount: {
  type: Number,
  default: 0,
  min: 0,
},

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    bookingStatus: {
  type: String,
  enum: ["pending", "confirmed", "needs_resolution"],
  default: "pending",
},
},
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);