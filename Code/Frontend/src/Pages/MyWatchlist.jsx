import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function MyWatchlist() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("token");

        const response = await axios.get(`${API_URL}/watchlist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMovies(response.data.watchlist || []);
      } catch (err) {
        console.error("Fetch Watchlist Error:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load your watchlist."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, []);

  const handleRemove = async (movieId) => {
    try {
      setRemovingId(movieId);

      const token = sessionStorage.getItem("token");

      await axios.delete(`${API_URL}/watchlist/${movieId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMovies((previousMovies) =>
        previousMovies.filter((movie) => movie._id !== movieId)
      );
    } catch (err) {
      console.error("Remove Watchlist Error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to remove movie from watchlist."
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="details-container">
        <h2>Loading your watchlist...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="details-container">
        <h2>Something went wrong</h2>
        <p role="alert">{error}</p>
      </div>
    );
  }

  return (
    <div className="movies-container">
      <h1>❤️ My Watchlist</h1>

      <p>Movies you have saved to watch later.</p>

      {movies.length === 0 ? (
        <div className="details-container">
          <h2>Your watchlist is empty.</h2>
          <p>Explore movies and save your favourites!</p>

          <Link to="/movies" className="book-btn">
            Explore Movies
          </Link>
        </div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <div className="movie-card" key={movie._id}>
              <div
                style={{
                  fontSize: "55px",
                  textAlign: "center",
                  marginBottom: "15px",
                }}
              >
                🎬
              </div>

              <h3>{movie.title}</h3>

              <p>
                <strong>Genre:</strong> {movie.genre}
              </p>

              <p>
                <strong>Language:</strong> {movie.language}
              </p>

              <p>
                <strong>Rating:</strong> ⭐ {movie.rating}/10
              </p>

              <div
                
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "15px",
    width: "100%",
  }}
>
              
         <Link
  to={`/movies/${movie._id}`}
  className="book-btn"
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    textAlign: "center",
    textDecoration: "none",
    boxSizing: "border-box",
  }}
>
  View Details
</Link>
       <button
                  type="button"
                  className="book-btn"
                  onClick={() => handleRemove(movie._id)}
                  disabled={removingId === movie._id}
                  style={{
                    background: "#dc2626",
                    cursor:
                      removingId === movie._id
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {removingId === movie._id
                    ? "Removing..."
                    : "❤️ Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyWatchlist;