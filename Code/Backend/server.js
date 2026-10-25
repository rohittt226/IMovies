const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const http = require("http");
const { Server } = require("socket.io");

const seatLockRoutes = require("./routes/seatLockRoutes");
const theatreRoutes = require("./routes/theatreRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const showRoutes = require("./routes/showRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const promoRoutes = require("./routes/promoRoutes");

const connectDB = require("./config/db");
const movieRoutes = require("./routes/movieRoutes");

dotenv.config();

const app = express();


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


app.set("io", io);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("IMovies Backend is Running Successfully!");
});


app.use("/api/movies", movieRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/seat-locks", seatLockRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/promos", promoRoutes);



io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  
  socket.on("joinShow", (showId) => {
    if (typeof showId !== "string" || !/^[a-fA-F0-9]{24}$/.test(showId)) {
      return;
    }

    socket.join(`show_${showId}`);

    console.log(`User joined show: ${showId}`);
  });

  
  socket.on("leaveShow", (showId) => {
    if (typeof showId !== "string" || !/^[a-fA-F0-9]{24}$/.test(showId)) {
      return;
    }

    socket.leave(`show_${showId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.IO ready for real-time updates");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();