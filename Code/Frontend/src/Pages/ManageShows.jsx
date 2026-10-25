import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BASE_URL = "http://localhost:5000/api";

const emptyForm = {
  movie: "",
  theatre: "",
  showTime: "",
  price: "",
  totalSeats: 50,
};


const toLocalDateTime = (dateString) => {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

function ManageShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const getToken = () => sessionStorage.getItem("token");

  
  const fetchData = async () => {
    try {
      setFetching(true);

      const token = getToken();

      if (!token) {
        throw new Error("Please login as admin first");
      }

      const [moviesRes, theatresRes, showsRes] =
        await Promise.all([
          fetch(`${BASE_URL}/movies`),
          fetch(`${BASE_URL}/theatres`),
          fetch(`${BASE_URL}/shows`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const [moviesData, theatresData, showsData] =
        await Promise.all([
          moviesRes.json(),
          theatresRes.json(),
          showsRes.json(),
        ]);

      if (!moviesRes.ok) {
        throw new Error("Failed to load movies");
      }

      if (!theatresRes.ok) {
        throw new Error("Failed to load theatres");
      }

      if (!showsRes.ok) {
        throw new Error(
          showsData.message || "Failed to load shows"
        );
      }
console.log("Movies API response:", moviesData);
      setMovies(moviesData);
      setTheatres(theatresData);
      setShows(showsData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login as admin first");
      }

      const url = editingId
        ? `${BASE_URL}/shows/${editingId}`
        : `${BASE_URL}/shows`;

      const payload = {
        movie: form.movie,
        theatre: form.theatre,
        showTime: new Date(form.showTime).toISOString(),
        price: Number(form.price),
        totalSeats: Number(form.totalSeats),
      };

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save show"
        );
      }

      setForm(emptyForm);
      setEditingId(null);

      await fetchData();

      setMessage(
        editingId
          ? "Show updated successfully!"
          : "Show added successfully!"
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (show) => {
    setEditingId(show._id);

    setForm({
      movie: show.movie?._id || "",
      theatre: show.theatre?._id || "",
      showTime: toLocalDateTime(show.showTime),
      price: show.price,
      totalSeats: show.totalSeats,
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  
  const handleDelete = async (showId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this show?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login as admin first");
      }

      const response = await fetch(
        `${BASE_URL}/shows/${showId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete show"
        );
      }

      if (editingId === showId) {
        setEditingId(null);
        setForm(emptyForm);
      }

      await fetchData();
      setMessage("Show deleted successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <Link to="/admin">← Back to Dashboard</Link>

      <h1>🎬 Manage Shows</h1>

      <div style={styles.card}>
        <h2>
          {editingId ? "Edit Show" : "Add New Show"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label>Movie</label>
          <select
            name="movie"
            value={form.movie}
            onChange={handleChange}
            required
            style={styles.input}
          >
            <option value="">Select Movie</option>

            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>
                {movie.title}
              </option>
            ))}
          </select>

          <label>Theatre</label>
          <select
            name="theatre"
            value={form.theatre}
            onChange={handleChange}
            required
            style={styles.input}
          >
            <option value="">Select Theatre</option>

            {theatres.map((theatre) => (
              <option key={theatre._id} value={theatre._id}>
                {theatre.name} - {theatre.city}
              </option>
            ))}
          </select>

          <label>Show Date & Time</label>
          <input
            type="datetime-local"
            name="showTime"
            value={form.showTime}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <label>Ticket Price (₹)</label>
          <input
            type="number"
            name="price"
            min="1"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <label>Total Seats</label>
          <input
            type="number"
            name="totalSeats"
            min="1"
            step="1"
            value={form.totalSeats}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : editingId
              ? "Update Show"
              : "Add Show"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <h2>All Shows</h2>

      {message && (
        <p role="status" style={styles.message}>
          {message}
        </p>
      )}

      {fetching ? (
        <p>Loading shows...</p>
      ) : shows.length === 0 ? (
        <p>No shows found.</p>
      ) : (
        <div style={styles.grid}>
          {shows.map((show) => (
            <div key={show._id} style={styles.card}>
              <h3>
                {show.movie?.title || "Movie unavailable"}
              </h3>

              <p>
                🏢 {show.theatre?.name || "Theatre unavailable"}
              </p>

              <p>
                📍 {show.theatre?.city || "N/A"}
              </p>

              <p>
                🕒{" "}
                {new Date(show.showTime).toLocaleString(
                  "en-IN"
                )}
              </p>

              <p>💰 ₹{show.price}</p>

              <p>💺 Total Seats: {show.totalSeats}</p>

              <p>
                🎟️ Booked Seats:{" "}
                {show.bookedSeats?.length || 0}
              </p>

              <button onClick={() => handleEdit(show)}>
                Edit
              </button>

              <button
                onClick={() => handleDelete(show._id)}
                style={{
                  marginLeft: "10px",
                  background: "#dc2626",
                  color: "white",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "auto",
    padding: "30px",
  },
  card: {
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "10px",
    margin: "8px 0 18px",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  message: {
    padding: "10px",
    background: "#e0f2fe",
    color: "#075985",
    marginBottom: "20px",
  },
};

export default ManageShows;