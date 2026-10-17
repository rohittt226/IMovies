import { Link } from "react-router-dom";
import { movies } from "../Data/movies.js";

function Home() {
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

        <div className="movie-container">
          {movies.map((movie) => (
            <div className="movie-card" key={movie.id}>
              <div className="movie-poster">🎥</div>

              <div className="movie-info">
                <h3>{movie.title}</h3>

                <p>{movie.genre}</p>

                <p>Language: {movie.language}</p>

                <p>⭐ {movie.rating}/10</p>

                <Link
                  to={`/movies/${movie.id}`}
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