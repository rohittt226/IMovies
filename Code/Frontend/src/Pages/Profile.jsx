import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function Profile({ onProfileUpdate }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [changingPassword, setChangingPassword] = useState(false);
const [passwordMessage, setPasswordMessage] = useState("");
const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const token = sessionStorage.getItem("token");

        const response = await axios.get(
          `${API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUser(response.data.user);
        setName(response.data.user.name);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const updatedName = name.trim();

    if (updatedName.length < 2 || updatedName.length > 50) {
      setError("Name must contain 2 to 50 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token = sessionStorage.getItem("token");

      const response = await axios.put(
        `${API_URL}/auth/profile`,
        { name: updatedName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(response.data.user);
      setName(response.data.user.name);

      if (onProfileUpdate) {
        onProfileUpdate(response.data.user);
      }

      setMessage("✅ Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
  e.preventDefault();

  setPasswordError("");
  setPasswordMessage("");

  if (newPassword.length < 8) {
    setPasswordError("New password must contain at least 8 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError("New password and confirm password do not match.");
    return;
  }

  try {
    setChangingPassword(true);

    const token = sessionStorage.getItem("token");

    const response = await axios.put(
      `${API_URL}/auth/change-password`,
      {
        currentPassword,
        newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setPasswordMessage(
      response.data.message || "Password changed successfully!"
    );

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (err) {
    setPasswordError(
      err.response?.data?.message || "Failed to change password."
    );
  } finally {
    setChangingPassword(false);
  }
};

  if (loading) {
    return (
      <div className="details-container">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="details-container">
        <h2>Unable to load profile</h2>
        <p role="alert">{error}</p>
      </div>
    );
  }

  return (
    <div className="details-container">
      <div
        style={{
          maxWidth: "500px",
          margin: "30px auto",
          padding: "25px",
          background: "#1f2937",
          borderRadius: "12px",
          color: "#ffffff",
        }}
      >
        <h1>👤 My Profile</h1>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Role:</strong> {user.role}
        </p>

        <form onSubmit={handleUpdate}>
          <div style={{ marginTop: "20px" }}>
            <label htmlFor="profile-name">
              <strong>Name:</strong>
            </label>

            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={50}
              required
              style={{
                display: "block",
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                marginBottom: "20px",
                borderRadius: "6px",
                border: "1px solid #9ca3af",
                boxSizing: "border-box",
                background: "#ffffff",
                color: "#111827",
              }}
            />
          </div>

          <button
            type="submit"
            className="book-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {message && (
          <p role="status" style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}

        {error && (
          <p role="alert" style={{ marginTop: "15px" }}>
            {error}
          </p>
        )}
      </div>
      <hr
  style={{
    margin: "30px 0",
    border: "1px solid #374151",
  }}
/>

<h2>🔒 Change Password</h2>

<form onSubmit={handleChangePassword}>
  <div style={{ marginBottom: "15px" }}>
    <label htmlFor="current-password">Current Password</label>

    <input
      id="current-password"
      type="password"
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
      required
      autoComplete="current-password"
      style={{
        display: "block",
        width: "100%",
        padding: "12px",
        marginTop: "8px",
        boxSizing: "border-box",
        borderRadius: "6px",
      }}
    />
  </div>

  <div style={{ marginBottom: "15px" }}>
    <label htmlFor="new-password">New Password</label>

    <input
      id="new-password"
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      minLength={8}
      required
      autoComplete="new-password"
      style={{
        display: "block",
        width: "100%",
        padding: "12px",
        marginTop: "8px",
        boxSizing: "border-box",
        borderRadius: "6px",
      }}
    />
  </div>

  <div style={{ marginBottom: "20px" }}>
    <label htmlFor="confirm-password">Confirm New Password</label>

    <input
      id="confirm-password"
      type="password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      minLength={8}
      required
      autoComplete="new-password"
      style={{
        display: "block",
        width: "100%",
        padding: "12px",
        marginTop: "8px",
        boxSizing: "border-box",
        borderRadius: "6px",
      }}
    />
  </div>

  <button
    type="submit"
    className="book-btn"
    disabled={changingPassword}
  >
    {changingPassword ? "Changing Password..." : "Change Password"}
  </button>
</form>

{passwordMessage && (
  <p role="status" style={{ marginTop: "15px", color: "#86efac" }}>
    {passwordMessage}
  </p>
)}

{passwordError && (
  <p role="alert" style={{ marginTop: "15px", color: "#fca5a5" }}>
    {passwordError}
  </p>
)}
    </div>
  );
}

export default Profile;