import { Link } from "react-router-dom";
import { movies } from "../data/movies";

function Movies() {
  return (
    <section className="movies-section">
      <h1>All Movies</h1>

      <div className="movie-container">
        {movies.map((movie) => (
          <div className="movie-card" key={movie.id}>
            <div className="movie-poster">🎬</div>

            <div className="movie-info">
              <h3>{movie.title}</h3>

              <p>{movie.genre}</p>

              <p>Language: {movie.language}</p>

              <p>⭐ {movie.rating}/10</p>

              <Link
                to={`/movies/${movie.id}`}
                className="book-btn movie-link"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Movies;