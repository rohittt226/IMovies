import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Movies from "./Pages/Movies.jsx";
import MovieDetails from "./Pages/MovieDetails.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">

        
        <nav className="navbar">
          <Link to="/" className="logo-link">
            <h2 className="logo">🎬 IMovies</h2>
          </Link>

          <div className="nav-links">
            <Link to="/">Home</Link>

            <Link to="/movies">Movies</Link>

            <Link to="/bookings">My Bookings</Link>

            <Link to="/login" className="login-btn">
              Login
            </Link>
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
        </Routes>

      
        <footer className="footer">
          <p>© 2026 IMovies. All Rights Reserved.</p>
        </footer>

      </div>
    </BrowserRouter>
  );
}

export default App;