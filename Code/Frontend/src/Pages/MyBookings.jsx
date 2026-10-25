import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings } from "../api/bookingApi";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load bookings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="seat-page">
      <h2>My Bookings 🎟️</h2>

      {bookings.length === 0 ? (
        <div>
          <p>You have no bookings yet.</p>
          <Link to="/movies">Explore Movies</Link>
        </div>
      ) : (
        bookings.map((booking) => (
          <div className="booking-card" key={booking._id}>
            <h3>{booking.show?.movie?.title || "Movie"}</h3>

            <p>
              Theatre: {booking.show?.theatre?.name || "N/A"}
            </p>

            <p>
              Show Time:{" "}
              {booking.show?.showTime
                ? new Date(booking.show.showTime).toLocaleString()
                : "N/A"}
            </p>

            <p>Seats: {booking.seats.join(", ")}</p>

            <p>Total Amount: ₹{booking.totalAmount}</p>

            <p>Status: {booking.status}</p>
            {booking.status === "confirmed" && (
  <Link
    to={`/ticket/${booking._id}`}
    className="view-ticket-btn"
  >
    🎟️ View Ticket
  </Link>
)}
          </div>
        ))
      )}
    </div>
  );
}

export default MyBookings;