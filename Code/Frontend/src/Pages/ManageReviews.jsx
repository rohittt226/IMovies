import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api/reviews";

function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      const response = await axios.get(`${API_URL}/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error("Fetch Admin Reviews Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(reviewId);
      setError("");
      setMessage("");

      const token = sessionStorage.getItem("token");

      await axios.delete(`${API_URL}/admin/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReviews((previousReviews) =>
        previousReviews.filter(
          (review) => review._id !== reviewId
        )
      );

      setMessage("Review deleted successfully.");
    } catch (err) {
      console.error("Delete Review Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete review."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="details-container">
      <h1>⭐ Review Management</h1>

      <p>View and moderate movie reviews submitted by users.</p>

      <Link to="/admin" className="back-link">
        ← Back to Admin Dashboard
      </Link>

      {message && (
        <p role="status" style={{ color: "#22c55e" }}>
          {message}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews available.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          {reviews.map((review) => (
            <div
              key={review._id}
              className="movie-card"
              style={{
                width: "100%",
                maxWidth: "650px",
                boxSizing: "border-box",
              }}
            >
              <h3>
                🎬 {review.movie?.title || "Deleted Movie"}
              </h3>

              <p>
                <strong>User:</strong>{" "}
                {review.user?.name || "Deleted User"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {review.user?.email || "Not available"}
              </p>

              <p>
                <strong>Rating:</strong>{" "}
                {"⭐".repeat(review.rating)} ({review.rating}/5)
              </p>

              <p style={{ overflowWrap: "anywhere" }}>
                <strong>Review:</strong> {review.comment}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(review.createdAt).toLocaleDateString(
                  "en-IN"
                )}
              </p>

              <button
                type="button"
                onClick={() => handleDeleteReview(review._id)}
                disabled={deletingId !== null}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor:
                    deletingId !== null ? "not-allowed" : "pointer",
                }}
              >
                {deletingId === review._id
                  ? "Deleting..."
                  : "Delete Review"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageReviews;