import axios from "axios";

const API_URL = "http://localhost:5000/api/bookings";

export const createBooking = async (paymentId) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Please login first");
  }

  const response = await axios.post(
    API_URL,
    { paymentId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getMyBookings = async () => {
  const token = sessionStorage.getItem("token");

  const response = await axios.get(`${API_URL}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};