import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ManagePayments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("Please login as admin.");
        }

        const response = await fetch(
          "http://localhost:5000/api/admin/payments",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load payments"
          );
        }

        setPayments(data.payments || []);
        setSummary(data.summary);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  return (
    <div className="details-container">
      <Link to="/admin">← Back to Dashboard</Link>

      <h1>💳 Payment Management</h1>
      <p>View payment transactions and revenue statistics.</p>

      {loading && <p>Loading payment records...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && summary && (
        <>
          <h2>📊 Revenue Overview</h2>

          <div className="movie-container">
            <div className="movie-card">
              <h3>Total Payments</h3>
              <h2>{summary.totalPayments}</h2>
            </div>

            <div className="movie-card">
              <h3>Successful Payments</h3>
              <h2>{summary.successfulPayments}</h2>
            </div>

            <div className="movie-card">
              <h3>Pending Payments</h3>
              <h2>{summary.pendingPayments}</h2>
            </div>

            <div className="movie-card">
              <h3>Failed Payments</h3>
              <h2>{summary.failedPayments}</h2>
            </div>

            <div className="movie-card">
              <h3>Gross Captured Payments</h3>
              <h2>{formatCurrency(summary.totalRevenue)}</h2>
            </div>

            <div className="movie-card">
              <h3>Unresolved Paid Bookings</h3>
              <h2>{summary.unresolvedPayments}</h2>
            </div>
          </div>

          <h2 style={{ marginTop: "30px" }}>
            Payment Transactions
          </h2>

          {payments.length === 0 ? (
            <p>No payment records found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "20px",
                }}
              >
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Booking Status</th>
                    <th>Seats</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        {payment.user?.name || "Unknown"}
                        <br />
                        <small>
                          {payment.user?.email || ""}
                        </small>
                      </td>

                      <td>
                        {formatCurrency(payment.amount)}
                      </td>

                      <td>{payment.status}</td>

                      <td>
                        {payment.bookingStatus || "pending"}
                      </td>

                      <td>
                        {payment.seats?.join(", ") || "—"}
                      </td>

                      <td>
                        {new Date(
                          payment.createdAt
                        ).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManagePayments;