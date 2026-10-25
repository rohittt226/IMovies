import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { createBooking } from "../api/bookingApi";
import socket from "../api/socket";


import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getPendingBookings,
} from "../api/paymentApi";

const API_URL = "http://localhost:5000/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [pendingOrderId, setPendingOrderId] = useState(
  () => sessionStorage.getItem(`pendingOrder_${showId}`)
);

  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState(
  () => sessionStorage.getItem(`pendingBooking_${showId}`)
);
  const [otherLockedSeats, setOtherLockedSeats] = useState([]);
const [promoCode, setPromoCode] = useState("");
const [promoError, setPromoError] = useState("");
const [promoMessage, setPromoMessage] = useState("");
const [appliedPromo, setAppliedPromo] = useState(null);

  const fetchShow = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/shows/${showId}`
      );

      setShow(response.data);
    } catch (err) {
      setError("Unable to load show details");
    }
  };

  const fetchLockedSeats = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/seat-locks/show/${showId}`
    );

    const activeSeats = response.data.lockedSeats.map(
      (lock) => lock.seat
    );

    setOtherLockedSeats(activeSeats);
  } catch (err) {
    console.error("Failed to fetch locked seats:", err);
  }
};

useEffect(() => {
  const loadPendingPayment = async () => {
    try {
      const payments = await getPendingBookings();

      const pendingPayment = payments.find(
        (payment) =>
          String(payment.show) === String(showId)
      );

      if (pendingPayment) {
        sessionStorage.setItem(
          `pendingBooking_${showId}`,
          pendingPayment._id
        );

        setPendingPaymentId(pendingPayment._id);
      }
    } catch (error) {
      console.error(
        "Failed to load pending payment:",
        error
      );
    }
  };

  loadPendingPayment();
}, [showId]);

useEffect(() => {
  
  const interval = setInterval(() => {
    fetchLockedSeats();
    fetchShow();
  }, 5000);

  return () => clearInterval(interval);
}, [showId]);

 useEffect(() => {
  fetchShow();
  fetchLockedSeats();
}, [showId]);

  useEffect(() => {
  socket.connect();

  const joinRoom = () => {
    socket.emit("joinShow", showId);
  };

  const handleSeatsUpdated = (data) => {
  if (String(data.showId) !== String(showId)) return;

  if (data.action === "refresh") {
    fetchLockedSeats();
    fetchShow();
    return;
  }

  if (data.action === "locked") {
    setOtherLockedSeats((previous) => [
      ...new Set([...previous, ...data.seats]),
    ]);
  }

  if (data.action === "released") {
    setOtherLockedSeats((previous) =>
      previous.filter((seat) => !data.seats.includes(seat))
    );
  }

  if (data.action === "booked") {
    
    setOtherLockedSeats((previous) =>
      previous.filter((seat) => !data.seats.includes(seat))
    );

    
    setShow((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        bookedSeats: [
          ...new Set([
            ...previous.bookedSeats,
            ...data.seats,
          ]),
        ],
      };
    });

    
    setSelectedSeats((previous) =>
      previous.filter((seat) => !data.seats.includes(seat))
    );
  }
};

  socket.on("connect", joinRoom);
  socket.on("seatsUpdated", handleSeatsUpdated);

  if (socket.connected) {
    joinRoom();
  }

  return () => {
    socket.emit("leaveShow", showId);
    socket.off("connect", joinRoom);
    socket.off("seatsUpdated", handleSeatsUpdated);
    socket.disconnect();
  };
}, [showId]);
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining === 0) {
  setExpiresAt(null);
  setLockedSeats([]);
  setSelectedSeats([]);
  setTimeLeft(0);

  setError("Seat lock expired. Please select seats again.");

  fetchShow();
  fetchLockedSeats();
}
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, showId]);

  const toggleSeat = (seat) => {
    if (loading || lockedSeats.length > 0) return;

    if (
  show.bookedSeats.includes(seat) ||
  otherLockedSeats.includes(seat)
) {
  return;
}

    setSelectedSeats((previous) =>
      previous.includes(seat)
        ? previous.filter((s) => s !== seat)
        : [...previous, seat]
    );
  };

  const getToken = () => sessionStorage.getItem("token");

  const handleLockSeats = async () => {
    if (selectedSeats.length === 0 || loading) return;

    const token = getToken();

    if (!token) {
      alert("Please login to continue");
      navigate("/login", {
        state: { from: `/seats/${showId}` },
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/seat-locks/lock`,
        {
          showId,
          seats: selectedSeats,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLockedSeats([...selectedSeats]);
      setExpiresAt(response.data.expiresAt);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to lock seats"
      );

      await fetchShow();
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseSeats = async () => {
    if (lockedSeats.length === 0 || loading) return;

    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/seat-locks/release`,
        {
          showId,
          seats: lockedSeats,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      setLockedSeats([]);
      setSelectedSeats([]);
      setExpiresAt(null);
      setTimeLeft(0);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to release seats"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
  if (
    lockedSeats.length === 0 ||
    loading ||
    timeLeft <= 0
  ) {
    return;
  }

  setLoading(true);
  setError("");

  try {
    const scriptLoaded = await loadRazorpayScript();
if (pendingOrderId) {
  const paymentStatus = await getPaymentStatus(pendingOrderId);

  if (paymentStatus.status === "paid") {
    if (paymentStatus.bookingId) {
      sessionStorage.removeItem(`pendingOrder_${showId}`);
      sessionStorage.removeItem(`pendingBooking_${showId}`);

      navigate("/bookings");
      return;
    }

    if (paymentStatus.bookingStatus === "needs_resolution") {
      setError(
        "Payment received, but booking could not be confirmed. Please contact support. Do not pay again."
      );
      return;
    }

    if (paymentStatus.paymentId) {
      sessionStorage.setItem(
        `pendingBooking_${showId}`,
        paymentStatus.paymentId
      );

      setPendingPaymentId(paymentStatus.paymentId);

      setError(
        "Your payment was received. Please use Retry Booking to confirm your ticket. Do not pay again."
      );
      return;
    }
  }

  
  setError(
    "An earlier payment order is still pending. Please check its status before attempting another payment."
  );
  return;
}

    if (!scriptLoaded) {
      throw new Error("Unable to load Razorpay Checkout");
    }

    
    const order = await createPaymentOrder(
  showId,
  lockedSeats,
  promoCode.trim()
);
    
sessionStorage.setItem(
  `pendingOrder_${showId}`,
  order.orderId
);
setPendingOrderId(order.orderId);
  
if (order.reservationExpiresAt) {
  setExpiresAt(order.reservationExpiresAt);
}

    
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "IMovies",
      description: "Movie Ticket Booking - Test Payment",
      order_id: order.orderId,

      handler: async (response) => {
        try {
          
          const verifiedPayment = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          sessionStorage.setItem(
  `pendingBooking_${showId}`,
  verifiedPayment.paymentId

);
setPendingPaymentId(verifiedPayment.paymentId);

          
          await createBooking(verifiedPayment.paymentId);
sessionStorage.removeItem(`pendingBooking_${showId}`);
sessionStorage.removeItem(`pendingOrder_${showId}`);
setPendingOrderId(null);
setPendingPaymentId(null);

          setExpiresAt(null);
          setLockedSeats([]);
          setSelectedSeats([]);

          alert("🎉 Payment Successful! Booking Confirmed.");

          navigate("/bookings");
        } catch (err) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Payment completed, but booking confirmation failed."
          );

          await fetchShow();
          await fetchLockedSeats();
        } finally {
          setLoading(false);
        }
      },

     modal: {
  ondismiss: () => {
    setLoading(false);

    setError(
      "Payment window closed. If you completed a payment, please check My Bookings before trying again. Your seat reservation will expire automatically."
    );
  },
},

      theme: {
        color: "#e50914",
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", (response) => {
      setLoading(false);
      setError(
        response.error?.description ||
          "Payment failed. Please try again."
      );
    });

    razorpay.open();
  } catch (err) {
    setLoading(false);

    setError(
      err.response?.data?.message ||
        err.message ||
        "Unable to start payment."
    );
  }
};

const handleCheckPaymentStatus = async () => {
  const orderId = sessionStorage.getItem(`pendingOrder_${showId}`);

  if (!orderId || loading) return;

  setLoading(true);
  setError("");

  try {
    const result = await getPaymentStatus(orderId);

    
    if (result.bookingId) {
      sessionStorage.removeItem(`pendingOrder_${showId}`);
      sessionStorage.removeItem(`pendingBooking_${showId}`);

      setPendingOrderId(null);
      setPendingPaymentId(null);

      alert("Your booking is already confirmed!");
      navigate("/bookings");
      return;
    }

    
    if (result.bookingStatus === "needs_resolution") {
      setError(
        "Payment received, but booking needs support review. Do not pay again."
      );
      return;
    }

    
    if (result.status === "paid" && result.paymentId) {
      sessionStorage.setItem(
        `pendingBooking_${showId}`,
        result.paymentId
      );

      setPendingPaymentId(result.paymentId);

      setError(
        "Payment received! Please use Retry Booking to confirm your ticket. Do not pay again."
      );
      return;
    }

  
    setError(
      "Payment is not confirmed yet. Please wait and check again. Do not start another payment."
    );
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Unable to check payment status. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

const handleRetryBooking = async () => {
  if (!pendingPaymentId || loading) return;

  try {
    setLoading(true);
    setError("");

    await createBooking(pendingPaymentId);

    sessionStorage.removeItem(`pendingBooking_${showId}`);
sessionStorage.removeItem(`pendingOrder_${showId}`);

setPendingPaymentId(null);
setPendingOrderId(null);
    setExpiresAt(null);
    setLockedSeats([]);
    setSelectedSeats([]);

    alert("🎉 Booking confirmed successfully!");
    navigate("/bookings");
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Booking could not be confirmed. Please contact support."
    );
  } finally {
    setLoading(false);
  }
};
  if (!show) {
    return <p>{error || "Loading seats..."}</p>;
  }

  const seats = Array.from(
    { length: show.totalSeats },
    (_, index) => `S${index + 1}`
  );

  const accessibleSeats = new Set(
  show.theatre?.accessibleSeats || []
);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <div className="seat-page">
      <h2>Select Your Seats</h2>

      <h3>{show.movie?.title}</h3>

      <p>
        {show.theatre?.name} - {show.theatre?.city}
      </p>

      <p>Ticket Price: ₹{show.price}</p>

      <div className="cinema-screen">SCREEN</div>

      <div className="seat-grid">
        {seats.map((seat) => {
         const booked = show.bookedSeats.includes(seat);
const lockedByOther = otherLockedSeats.includes(seat);
const selected = selectedSeats.includes(seat);
const isAccessible = accessibleSeats.has(seat);
          return (
           <button
  key={ seat}
  title={
  isAccessible
    ? `Wheelchair-accessible seat ${seat}`
    : `Seat ${seat}`
}
  disabled={
    booked ||
    lockedByOther ||
    loading ||
    lockedSeats.length > 0
  }
  onClick={() => toggleSeat(seat)}
  className={`seat ${
    booked
      ? "booked"
      : lockedByOther
      ? "temporarily-locked"
      : selected
      ? "selected"
      : ""
  }`}
>
   {isAccessible ? `♿ ${seat}` : seat}
</button>
          );
        })}
      </div>
      <p style={{ marginTop: "12px", fontSize: "14px" }}>
  ♿ Wheelchair-accessible seat
</p>

      <p>
        Selected Seats: {selectedSeats.join(", ") || "None"}
      </p>

      <h3>Total: ₹{selectedSeats.length * show.price}</h3>

    
{selectedSeats.length > 0 && !pendingOrderId && (
  <div
    style={{
      marginTop: "20px",
      marginBottom: "20px",
      padding: "20px",
      backgroundColor: "#1f2937",
      borderRadius: "10px",
      color: "#ffffff",
      maxWidth: "450px",
    }}
  >
    <h3>🎟️ Have a Promo Code?</h3>

    <label htmlFor="promo-code">Promo Code</label>

    <input
      id="promo-code"
      type="text"
      placeholder="Enter promo code"
      value={promoCode}
      onChange={(e) => {
        setPromoCode(e.target.value.toUpperCase());
        setPromoError("");
        setPromoMessage("");
      }}
      disabled={loading}
      maxLength={30}
      style={{
        width: "100%",
        padding: "12px",
        marginTop: "8px",
        marginBottom: "12px",
        borderRadius: "6px",
        border: "1px solid #9ca3af",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        color: "#111827",
      }}
    />

    <p style={{ fontSize: "14px", color: "#d1d5db" }}>
      Available codes: IMOVIES10, MOVIE20, FIRST50
    </p>

    <p style={{ fontSize: "14px", color: "#d1d5db" }}>
      Discount will be calculated securely when you proceed to payment.
    </p>

    {promoError && (
      <p role="alert" style={{ color: "#fca5a5" }}>
        {promoError}
      </p>
    )}

    {promoMessage && (
      <p role="status" style={{ color: "#86efac" }}>
        {promoMessage}
      </p>
    )}
  </div>
)}

      {lockedSeats.length > 0 && (
        <p style={{ color: "green", fontWeight: "bold" }}>
          🔒 Seats locked! Time remaining: {formatTime(timeLeft)}
        </p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {pendingPaymentId && (
  <button
    onClick={handleRetryBooking}
    disabled={loading}
    style={{
      backgroundColor: "#28a745",
      color: "white",
      padding: "10px 20px",
      marginTop: "10px",
      cursor: "pointer",
    }}
  >
    {loading ? "Retrying..." : "Retry Booking (Already Paid)"}
  </button>
)}

      {lockedSeats.length === 0 ? (
        <button
          disabled={selectedSeats.length === 0 || loading}
          onClick={handleLockSeats}
        >
          {loading ? "Locking..." : "Continue"}
        </button>
      ) : (
        <>
         <button
  onClick={handleBooking}
  disabled={
    loading ||
    lockedSeats.length === 0 ||
    timeLeft <= 0 ||
    Boolean(pendingOrderId)
  }
>
  Confirm Booking
</button>

          {pendingOrderId && (
  <button
    type="button"
    onClick={handleCheckPaymentStatus}
    disabled={loading}
  >
    {loading ? "Checking..." : "🔄 Check Payment Status"}
  </button>
)}

          <button
            disabled={loading}
            onClick={handleReleaseSeats}
          >
            Release Seats
          </button>
        </>
      )}
    </div>
  );
}

export default SeatSelection;