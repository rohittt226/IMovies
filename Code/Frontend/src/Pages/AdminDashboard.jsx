import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

function AdminDashboard({ user }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          setError("Please login as admin.");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/admin/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Access denied");
        }

        setAdmin(data.admin);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <div className="details-container">
        <h2>Access Denied</h2>
        <p>Only administrators can access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <p>Loading Admin Dashboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="details-container">
      <h1>🎬 IMovies Admin Dashboard</h1>

      <p>Welcome, {admin?.name}!</p>

      <h2>Management Panel</h2>

      <div className="movie-container">
        <div className="movie-card">
          <h3>🎬 Movie Management</h3>
          <p>Add, update and remove movies.</p>
          <Link to="/admin/movies" className="book-btn">
            Manage Movies
          </Link>
        </div>

        <div className="movie-card">
          <h3>🏢 Theatre Management</h3>
          <p>Manage theatre information.</p>
          <Link to="/admin/theatres" className="book-btn">
            Manage Theatres
          </Link>
        </div>

        <div className="movie-card">
          <h3>📅 Show Management</h3>
          <p>Manage movie show schedules.</p>
          <Link to="/admin/shows" className="book-btn">
            Manage Shows
          </Link>
        </div>
        
<div className="movie-card">
  <h3>👥 User Management</h3>
  <p>View all registered users.</p>

  <Link to="/admin/users" className="book-btn">
    Manage Users
  </Link>
</div>

<div className="movie-card">
  <h3>💳 Payment Management</h3>

  <p>View transactions and revenue reports.</p>

  <Link to="/admin/payments" className="book-btn">
    Manage Payments
  </Link>
</div>

<div className="movie-card">
  <h3>⭐ Review Management</h3>

  <p>View and moderate user reviews and ratings.</p>

  <Link to="/admin/reviews" className="book-btn">
    Manage Reviews
  </Link>
</div>
      </div>
    </div>
  );
}


export default AdminDashboard;