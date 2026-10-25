import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function MovieDetails() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");

  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const token = sessionStorage.getItem("token");
  
const [isWatchlisted, setIsWatchlisted] = useState(false);
const [watchlistLoading, setWatchlistLoading] = useState(false);
const [watchlistChecking, setWatchlistChecking] = useState(true);
const [watchlistMessage, setWatchlistMessage] = useState("");


useEffect(() => {
  let cancelled = false;

  const checkWatchlist = async () => {
    setIsWatchlisted(false);
    setWatchlistMessage("");
    setWatchlistChecking(true);

    if (!token) {
      setWatchlistChecking(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/watchlist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (cancelled) return;

      const savedMovies = response.data.watchlist || [];

      const alreadySaved = savedMovies.some(
        (savedMovie) => savedMovie._id === id
      );

      setIsWatchlisted(alreadySaved);
    } catch (err) {
      if (cancelled) return;

      console.error("Check Watchlist Error:", err);
      setWatchlistMessage("Failed to check watchlist.");
    } finally {
      if (!cancelled) {
        setWatchlistChecking(false);
      }
    }
  };

  checkWatchlist();

  return () => {
    cancelled = true;
  };
}, [id, token]);

  
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewError("");

      const response = await axios.get(
        `${API_URL}/reviews/movie/${id}`
      );

      setReviews(response.data.reviews || []);
      setAverageRating(response.data.averageRating || 0);
    } catch (err) {
      console.error("Fetch Reviews Error:", err);
      setReviewError("Failed to load reviews.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const movieResponse = await axios.get(
          `${API_URL}/movies/${id}`
        );

        setMovie(movieResponse.data);

        const showResponse = await axios.get(
          `${API_URL}/shows/movie/${id}`
        );

        setShows(showResponse.data);
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError("Failed to load movie details or shows.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  useEffect(() => {
    setReviews([]);
    setAverageRating(0);
    setReviewMessage("");
    setComment("");
    setRating(0);

    fetchReviews();
  }, [id]);

  
const handleToggleWatchlist = async () => {
  if (!token) {
    setWatchlistMessage("Please login to manage your watchlist.");
    return;
  }

  try {
    setWatchlistLoading(true);
    setWatchlistMessage("");

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    if (isWatchlisted) {
      await axios.delete(
        `${API_URL}/watchlist/${id}`,
        config
      );

      setIsWatchlisted(false);
      setWatchlistMessage("Movie removed from watchlist.");
    } else {
      await axios.post(
        `${API_URL}/watchlist`,
        { movieId: id },
        config
      );

      setIsWatchlisted(true);
      setWatchlistMessage("Movie added to watchlist!");
    }
  } catch (err) {
    console.error("Watchlist Error:", err);

    setWatchlistMessage(
      err.response?.data?.message ||
      "Failed to update watchlist."
    );
  } finally {
    setWatchlistLoading(false);
  }
};
  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (rating === 0) {
  setReviewMessage("Please select a star rating.");
  return;
}

    if (!token) {
      setReviewMessage("Please login to submit a review.");
      return;
    }

    if (comment.trim().length < 3) {
      setReviewMessage("Review must contain at least 3 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setReviewMessage("");

      await axios.post(
        `${API_URL}/reviews`,
        {
          movieId: id,
          rating: Number(rating),
          comment: comment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviewMessage("✅ Review submitted successfully!");
      setComment("");
      setRating(0);

      await fetchReviews();
    } catch (err) {
      console.error("Submit Review Error:", err);

      setReviewMessage(
        err.response?.data?.message || "Failed to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="details-container">
        <h2>Loading Movie Details...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="details-container">
        <h2>{error}</h2>
        <Link to="/movies">Back to Movies</Link>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="details-container">
        <h2>Movie Not Found</h2>
        <Link to="/movies">Back to Movies</Link>
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


<div style={{ marginTop: "20px", marginBottom: "20px" }}>
  {!token ? (
    <p>
      ❤️ <Link to="/login">Login</Link> to save this movie
      to your watchlist.
    </p>
  ) : (
    <button
      type="button"
      className="book-btn"
      onClick={handleToggleWatchlist}
      disabled={watchlistLoading || watchlistChecking}
      style={{
        background: isWatchlisted ? "#dc2626" : "#2563eb",
        cursor:
          watchlistLoading || watchlistChecking
            ? "not-allowed"
            : "pointer",
      }}
    >
      {watchlistLoading
        ? "Updating..."
        : watchlistChecking
        ? "Checking Watchlist..."
        : isWatchlisted
        ? "❤️ Remove from Watchlist"
        : "🤍 Add to Watchlist"}
    </button>
  )}

  {watchlistMessage && (
    <p role="status" style={{ marginTop: "10px" }}>
      {watchlistMessage}
    </p>
  )}
</div>

<Link to="/movies" className="back-link">
  ← Back to Movies
</Link>
        </div>
      </div>

      

      <div className="available-shows">
        <h2>🎟️ Available Shows</h2>

        {shows.length === 0 ? (
          <p>No shows available for this movie.</p>
        ) : (
          shows.map((show) => (
            <div className="show-card" key={show._id}>
              <h3>{show.theatre?.name || "Theatre"}</h3>

              <p>
                📍 {show.theatre?.city || "City not available"}
              </p>

              <p>
                📅 {new Date(show.showTime).toLocaleDateString("en-IN")}
              </p>

              <p>
                🕒{" "}
                {new Date(show.showTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <p>💰 Ticket Price: ₹{show.price}</p>

              <Link
                to={`/seats/${show._id}`}
                className="book-btn"
              >
                Book Tickets
              </Link>
            </div>
          ))
        )}
      </div>

  

      <section
        className="movie-reviews"
        style={{
          marginTop: "35px",
          padding: "24px",
          background: "#1f2937",
          borderRadius: "12px",
          color: "#ffffff",
        }}
      >
        <h2>⭐ Reviews & Ratings</h2>

        {reviewsLoading ? (
          <p>Loading reviews...</p>
        ) : reviewError ? (
          <p role="alert">{reviewError}</p>
        ) : (
          <>
            <p>
              <strong>Average User Rating:</strong>{" "}
              ⭐ {averageRating}/5 ({reviews.length} reviews)
            </p>

            {reviews.length === 0 ? (
              <p>No reviews yet. Be the first to review this movie!</p>
            ) : (
              <div style={{ marginTop: "20px" }}>
                {reviews.map((review) => (
                  <article
                    key={review._id}
                    style={{
                      padding: "15px",
                      marginBottom: "12px",
                      background: "#374151",
                      borderRadius: "8px",
                    }}
                  >
                    <h3 style={{ marginBottom: "6px" }}>
                      {review.user?.name || "User"}
                    </h3>

                    <p aria-label={`${review.rating} out of 5 stars`}>
                      {"⭐".repeat(review.rating)}
                    </p>

                    <p style={{ overflowWrap: "anywhere" }}>
                      {review.comment}
                    </p>

                    <small>
                      {new Date(review.createdAt).toLocaleDateString(
                        "en-IN"
                      )}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        

        <div style={{ marginTop: "28px" }}>
          <h3>✍️ Write a Review</h3>

          {!token ? (
            <p>
              Please <Link to="/login">login</Link> to submit a review.
            </p>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="review-rating">
                  Your Rating:
                </label>

               <div
  style={{
    display: "flex",
    gap: "8px",
    marginTop: "10px",
    marginBottom: "15px",
  }}
  onMouseLeave={() => setHoverRating(0)}
>
  {[1, 2, 3, 4, 5].map((star) => (
    <button
      key={star}
      type="button"
      onClick={() => setRating(star)}
      onMouseEnter={() => setHoverRating(star)}
      aria-label={`Rate ${star} out of 5 stars`}
      aria-pressed={rating === star}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "32px",
        padding: "2px",
        color:
          star <= (hoverRating || rating)
            ? "#facc15"
            : "#6b7280",
      }}
    >
      ★
    </button>
  ))}
</div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="review-comment">
                  Your Review:
                </label>

                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  minLength={3}
                  maxLength={1000}
                  required
                  rows={4}
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "600px",
                    padding: "12px",
                    marginTop: "8px",
                    borderRadius: "6px",
                    color: "#111827",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                className="book-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}

          {reviewMessage && (
            <p
              role="status"
              style={{ marginTop: "12px" }}
            >
              {reviewMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default MovieDetails;