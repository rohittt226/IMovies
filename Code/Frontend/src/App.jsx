
import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import ManageUsers from "./Pages/ManageUsers";

import ManageShows from "./Pages/ManageShows";
import ManageTheatres from "./Pages/ManageTheatres";
import ManageMovies from "./Pages/ManageMovies";
import Ticket from "./Pages/Ticket";
import MyBookings from "./Pages/MyBookings";
import SeatSelection from "./Pages/SeatSelection";
import Home from "./Pages/Home";
import Movies from "./Pages/Movies";
import MovieDetails from "./Pages/MovieDetails";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import AdminDashboard from "./Pages/AdminDashboard";
import ManagePayments from "./Pages/ManagePayments";
import AdminRoute from "./Components/AdminRoute";
import ManageReviews from "./Pages/ManageReviews";
import MyWatchlist from "./Pages/MyWatchlist";
import Profile from "./Pages/Profile";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [menuOpen, setMenuOpen] = useState(false);

useEffect(() => {
  const restoreSession = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      setAuthLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Session expired or invalid");
      }

      const data = await response.json();

      setUser(data.user);
    } catch (error) {
      console.error("Session restore failed:", error.message);

      
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  restoreSession();
}, []);

  const handleLogin = (userData, token) => {
  if (!token) {
    console.error("Login token missing!");
    return;
  }

  sessionStorage.setItem("token", token);
  setUser(userData);

  console.log("Login successful:", {
    tokenSaved: !!sessionStorage.getItem("token"),
    role: userData?.role,
  });
};
  const handleLogout = () => {
  sessionStorage.removeItem("token");
  setUser(null);
  setMenuOpen(false);
};
  const handleProfileUpdate = (updatedUser) => {
  setUser(updatedUser);
};

  if (authLoading) {
  return <p>Restoring your session...</p>;
}

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="logo-link">
            <h2 className="logo">🎬 IMovies</h2>
          </Link>
          <button
  type="button"
  className="menu-toggle"
  onClick={() => setMenuOpen((prev) => !prev)}
  aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
  aria-expanded={menuOpen}
  aria-controls="main-navigation"
>
  {menuOpen ? "✕" : "☰"}
</button>

          <div
  id="main-navigation"
  className={`nav-links ${menuOpen ? "nav-open" : ""}`}
  onClick={(event) => {
    if (event.target.closest("a")) {
      setMenuOpen(false);
    }
  }}
>
  <Link to="/">Home</Link>
<Link to="/movies">Movies</Link>
{user && (
  <Link to="/watchlist">❤️ My Watchlist</Link>
)}
{user && (
  <Link to="/profile">👤 My Profile</Link>
)}

<Link to="/bookings">My Bookings</Link>
            {user ? (
              <>
                <span className="user-name">
                  Hi, {user.name}
                </span>

                {user.role === "admin" && (
  <Link to="/admin">Admin Dashboard</Link>
)}

                <button
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-btn">
                  Login
                </Link>

                <Link to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/movies" element={<Movies />} />

          <Route
            path="/movies/:id"
            element={<MovieDetails />}
          />

          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
          />

          <Route
            path="/register"
            element={<Register onLogin={handleLogin} />}
          />

          <Route
            path="*"
            element={
              <div className="details-container">
                <h2>Page Not Found</h2>
                <Link to="/movies" className="hero-btn">
                  Browse Movies
                </Link>
              </div>
            }
          />
          <Route path="/seats/:showId" element={<SeatSelection />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route
  path="/watchlist"
  element={
    user ? (
      <MyWatchlist />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        <Route path="/ticket/:bookingId" element={<Ticket />} />

       <Route element={<AdminRoute user={user} />}>
  <Route
    path="/admin"
    element={<AdminDashboard user={user} />}
  />
<Route
  path="/admin/movies"
  element={<ManageMovies />}
/>

  <Route
    path="/admin/theatres"
    element={<ManageTheatres />}
  />

  <Route
    path="/admin/shows"
    element={<ManageShows />}
  />

  <Route
    path="/admin/users"
    element={<ManageUsers />}
  />

  <Route
    path="/admin/payments"
    element={<ManagePayments />}
  />

  <Route path="/admin/reviews" element={<ManageReviews />} />

  
</Route>

<Route
  path="/profile"
  element={
    user ? (
      <Profile onProfileUpdate={handleProfileUpdate} />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
        </Routes>

        <footer className="footer">
          <p>© 2026 IMovies. All Rights Reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;