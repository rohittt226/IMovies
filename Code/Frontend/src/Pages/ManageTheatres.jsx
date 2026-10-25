import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api/theatres";

const emptyForm = {
  name: "",
  city: "",
  address: "",
  accessibleSeats: "",
};

function ManageTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  
  const fetchTheatres = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load theatres");
      }

      const data = await response.json();
      setTheatres(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("Please login as admin first");
      }

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
  ...form,
  accessibleSeats: form.accessibleSeats
    .split(",")
    .map((seat) => seat.trim().toUpperCase())
    .filter(Boolean),
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      setMessage(
        editingId
          ? "Theatre updated successfully!"
          : "Theatre added successfully!"
      );

      setForm(emptyForm);
      setEditingId(null);

      await fetchTheatres();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleEdit = (theatre) => {
    setEditingId(theatre._id);

   setForm({
  name: theatre.name || "",
  city: theatre.city || "",
  address: theatre.address || "",
  accessibleSeats: (theatre.accessibleSeats || []).join(", "),
});

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  
  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  
  const handleDelete = async (theatreId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this theatre?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        throw new Error("Please login as admin first");
      }

      const response = await fetch(
        `${API_URL}/${theatreId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete theatre");
      }

      if (editingId === theatreId) {
        cancelEdit();
      }

      await fetchTheatres();
      setMessage("Theatre deleted successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1100px",
        margin: "auto",
      }}
    >
      <Link to="/admin">← Back to Dashboard</Link>

      <h1>🏢 Manage Theatres</h1>

      <h2>
        {editingId ? "Edit Theatre" : "Add New Theatre"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="name">Theatre Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            value={form.city}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
  <label htmlFor="accessibleSeats">
    ♿ Wheelchair-Accessible Seats
  </label>

  <input
    id="accessibleSeats"
    name="accessibleSeats"
    type="text"
    value={form.accessibleSeats}
    onChange={handleChange}
    placeholder="Example: S1, S2, S3"
    style={inputStyle}
  />

  <small style={{ color: "#9ca3af" }}>
    Enter accessible seat numbers separated by commas.
    Leave empty if no accessible seats are configured.
  </small>
</div>

        <button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : editingId
            ? "Update Theatre"
            : "Add Theatre"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        )}
      </form>

      {message && (
        <p role="status" style={{ marginTop: "15px" }}>
          {message}
        </p>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h2>All Theatres</h2>

      {theatres.length === 0 ? (
        <p>No theatres found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {theatres.map((theatre) => (
            <div
              key={theatre._id}
              style={{
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "10px",
              }}
            >
              <h3>{theatre.name}</h3>

              <p>📍 {theatre.city}</p>

              <p>{theatre.address}</p>

              <p>
  ♿ Accessible Seats:{" "}
  {theatre.accessibleSeats?.length
    ? theatre.accessibleSeats.join(", ")
    : "Not configured"}
</p>

              <button
                onClick={() => handleEdit(theatre)}
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(theatre._id)}
                style={{
                  marginLeft: "10px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  boxSizing: "border-box",
};

export default ManageTheatres;