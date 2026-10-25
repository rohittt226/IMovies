import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api/movies";

const emptyForm = {
  title: "",
  description: "",
  genre: "",
  language: "",
  duration: "",
  rating: "",
  poster: "",
};

function ManageMovies() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMovies = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load movies");
      }

      const data = await response.json();
      setMovies(Array.isArray(data) ? data : data.movies || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    fetchMovies();
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
      const token = sessionStorage.getItem("token");
      console.log("Token available:", Boolean(token));

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          duration: Number(form.duration),
          rating: Number(form.rating),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      setMessage(
        editingId
          ? "Movie updated successfully!"
          : "Movie added successfully!"
      );

      setForm(emptyForm);
      setEditingId(null);

      await fetchMovies();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (movie) => {
    setEditingId(movie._id);

    setForm({
      title: movie.title || "",
      description: movie.description || "",
      genre: movie.genre || "",
      language: movie.language || "",
      duration: movie.duration ?? "",
      rating: movie.rating ?? "",
      poster: movie.poster || "",
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  const handleDelete = async (movieId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this movie?"
  );

  if (!confirmed) return;

  try {
    const token = sessionStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/movies/${movieId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete movie");
    }

    setMessage("Movie deleted successfully!");

    if (editingId === movieId) {
      setEditingId(null);
      setForm(emptyForm);
    }

    await fetchMovies();
  } catch (error) {
    setMessage(error.message);
  }
};

  return (
    <div style={{ padding: "30px", maxWidth: "1100px", margin: "auto" }}>
      <Link to="/admin">← Back to Dashboard</Link>

      <h1>🎬 Manage Movies</h1>

      <h2>{editingId ? "Edit Movie" : "Add New Movie"}</h2>

      <form onSubmit={handleSubmit}>
        {[
          ["title", "Movie Title"],
          ["description", "Description"],
          ["genre", "Genre"],
          ["language", "Language"],
          ["duration", "Duration (minutes)"],
          ["rating", "Rating (0-10)"],
          ["poster", "Poster Image URL"],
        ].map(([name, label]) => (
          <div key={name} style={{ marginBottom: "15px" }}>
            <label htmlFor={name}>{label}</label>

            <br />

            <input
              id={name}
              name={name}
              value={form[name]}
              onChange={handleChange}
              type={
                name === "duration" || name === "rating"
                  ? "number"
                  : "text"
              }
              min={name === "duration" ? "1" : name === "rating" ? "0" : undefined}
              max={name === "rating" ? "10" : undefined}
              step={name === "rating" ? "0.1" : undefined}
              required={["title", "duration", "rating"].includes(name)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : editingId
            ? "Update Movie"
            : "Add Movie"}
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

      {message && <p role="status">{message}</p>}

      <hr style={{ margin: "30px 0" }} />

      <h2>All Movies</h2>

      {movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {movies.map((movie) => (
            <div
              key={movie._id}
              style={{
                padding: "15px",
                border: "1px solid #ccc",
                borderRadius: "10px",
              }}
            >
              {movie.poster && (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  style={{
                    width: "100%",
                    height: "250px",
                    objectFit: "cover",
                  }}
                />
              )}

              <h3>{movie.title}</h3>

              <p>{movie.genre}</p>

              <p>⭐ {movie.rating}</p>

              <button onClick={() => handleEdit(movie)}>
                Edit Movie
              </button>

              <button
  type="button"
  onClick={() => handleDelete(movie._id)}
  style={{
    marginLeft: "10px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
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

export default ManageMovies;