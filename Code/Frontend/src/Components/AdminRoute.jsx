import { Navigate, Outlet } from "react-router-dom";

function AdminRoute({ user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <div className="details-container">
        <h2>🚫 Access Denied</h2>
        <p>Only administrators can access this page.</p>
      </div>
    );
  }

  return <Outlet />;
}

export default AdminRoute;