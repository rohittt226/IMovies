import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/movies"
        );

        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setError("Failed to load movies.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  
  const genres = useMemo(() => {
    const allGenres = movies.flatMap((movie) =>
      Array.isArray(movie.genre)
        ? movie.genre
        : String(movie.genre || "").split(",")
    );

    return [
      "All",
      ...new Set(
        allGenres.map((genre) => genre.trim()).filter(Boolean)
      ),
    ];
  }, [movies]);

  
  const languages = useMemo(() => {
    return [
      "All",
      ...new Set(
        movies
          .map((movie) => movie.language?.trim())
          .filter(Boolean)
      ),
    ];
  }, [movies]);

  
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const title = String(movie.title || "").toLowerCase();

      const movieGenres = (
        Array.isArray(movie.genre)
          ? movie.genre
          : String(movie.genre || "").split(",")
      ).map((genre) => String(genre).trim().toLowerCase());

      const language = String(movie.language || "").toLowerCase();

      const matchesSearch = title.includes(
        search.trim().toLowerCase()
      );

      const matchesGenre =
        selectedGenre === "All" ||
        movieGenres.includes(selectedGenre.toLowerCase());

      const matchesLanguage =
        selectedLanguage === "All" ||
        language === selectedLanguage.toLowerCase();

      return (
        matchesSearch &&
        matchesGenre &&
        matchesLanguage
      );
    });
  }, [movies, search, selectedGenre, selectedLanguage]);

  if (loading) {
    return <h2>Loading Movies...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <section className="movies-section">
      <h1>🎬 Explore Movies</h1>

    
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        
        <input
          type="search"
          placeholder="🔍 Search movies by title..."
          aria-label="Search movies by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "2 1 250px",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #9ca3af",
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        />

    
        <select
          aria-label="Filter by genre"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          style={{
            flex: "1 1 150px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre === "All" ? "All Genres" : genre}
            </option>
          ))}
        </select>

        
        <select
          aria-label="Filter by language"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            flex: "1 1 150px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            color: "#111827",
          }}
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              {language === "All" ? "All Languages" : language}
            </option>
          ))}
        </select>
      </div>

  
      <p style={{ marginBottom: "20px" }} aria-live="polite">
        Showing {filteredMovies.length} of {movies.length} movies
      </p>

      
      <div className="movie-container">
        {filteredMovies.length === 0 ? (
          <div>
            <p>No movies found matching your search or filters.</p>

            <button
              type="button"
              className="book-btn"
              onClick={() => {
                setSearch("");
                setSelectedGenre("All");
                setSelectedLanguage("All");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredMovies.map((movie) => (
            <div className="movie-card" key={movie._id}>
              <div className="movie-poster">🎬</div>

              <div className="movie-info">
                <h3>{movie.title}</h3>

                <p>{movie.genre}</p>

                <p>Language: {movie.language}</p>

                <p>⭐ {movie.rating}/10</p>

                <Link
                  to={`/movies/${movie._id}`}
                  className="book-btn"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Movies;