import axios from "axios";

const API_URL = "http://localhost:5000/api/payments";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  },
});

export const createPaymentOrder = async (
  showId,
  seats,
  promoCode = null
) => {
  const response = await axios.post(
    `${API_URL}/create-order`,
    {
      showId,
      seats,
      promoCode,
    },
    getAuthConfig()
  );

  return response.data;
};
export const verifyPayment = async (paymentDetails) => {
  const response = await axios.post(
    `${API_URL}/verify`,
    paymentDetails,
    getAuthConfig()
  );

  return response.data;
};

export const getPaymentStatus = async (orderId) => {
  const response = await axios.get(
    `${API_URL}/status/${encodeURIComponent(orderId)}`,
    getAuthConfig()
  );

  return response.data;
};

export const getPendingBookings = async () => {
  const response = await axios.get(
    `${API_URL}/pending-bookings`,
    getAuthConfig()
  );

  return response.data;
};