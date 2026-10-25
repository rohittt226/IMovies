import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/movies"
        );

        const movieData = Array.isArray(response.data)
          ? response.data
          : response.data.movies || [];

        setMovies(movieData);
      } catch (error) {
        console.error("Failed to fetch movies:", error);

        setError("Failed to load movies");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Book Your Movie Tickets</h1>

        <p>
          Discover the latest movies and book your
          favorite seats with IMovies.
        </p>

        <Link to="/movies" className="hero-btn">
          Explore Movies
        </Link>
      </section>

      <section className="movies-section">
        <h2>Now Showing</h2>

        {loading && <p>Loading movies...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && movies.length === 0 && (
          <p>No movies available right now.</p>
        )}

        <div className="movie-container">
          {movies.map((movie) => (
            <div className="movie-card" key={movie._id}>
              <div className="movie-poster">🎥</div>

              <div className="movie-info">
                <h3>{movie.title}</h3>

                <p>{movie.genre}</p>

                <p>Language: {movie.language}</p>

                <p>⭐ {movie.rating}/10</p>

                <Link
                  to={`/movies/${movie._id}`}
                  className="book-btn movie-link"
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;