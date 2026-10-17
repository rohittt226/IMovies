import { useParams, Link } from "react-router-dom";
import { movies } from "../data/movies";

function MovieDetails() {
  const { id } = useParams();

  const movie = movies.find(
    (movie) => movie.id === Number(id)
  );

  if (!movie) {
    return (
      <div className="details-container">
        <h2>Movie Not Found</h2>

        <Link to="/movies" className="hero-btn">
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="details-container">
      <div className="details-card">
        <div className="details-poster">🎬</div>

        <div className="details-info">
          <h1>{movie.title}</h1>

          <p>
            <strong>Genre:</strong> {movie.genre}
          </p>

          <p>
            <strong>Language:</strong> {movie.language}
          </p>

          <p>
            <strong>Duration:</strong> {movie.duration} minutes
          </p>

          <p>
            <strong>Rating:</strong> ⭐ {movie.rating}/10
          </p>

          <p>{movie.description}</p>

          <button
            className="book-btn"
            disabled
            title="Seat booking will be available soon"
          >
            Booking Coming Soon
          </button>

          <Link to="/movies" className="back-link">
            ← Back to Movies
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MovieDetails;