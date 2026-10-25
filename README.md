# 🎬 IMovies — Movie Ticket Booking System

IMovies is a full-stack movie ticket booking web application developed using the MERN stack.

It provides movie browsing, theatre and show selection, online ticket booking, and administrative management.

## 🚀 Features

### User Features

* User registration and login
* JWT authentication
* Browse movies and view details
* Theatre and show selection
* Interactive seat selection
* Real-time seat locking using Socket.IO
* Movie ticket booking
* Razorpay test payment integration
* Booking history
* QR-code-based tickets
* Movie watchlist
* Reviews and ratings
* Promo codes
* Accessibility-tagged seating

### Admin Features

* Admin dashboard
* Movie management
* Theatre management
* Show management
* User management
* Review management
* Payment management
* Accessible seat configuration

## 🛠️ Technology Stack

**Frontend:** React.js, Vite, JavaScript, CSS, Axios, Socket.IO Client

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO

**Payment Gateway:** Razorpay (Test Mode)

## 📁 Project Structure

```text
IMovies/
├── Code/
│   ├── Backend/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── server.js
│   │   └── package.json
│   └── Frontend/
│       ├── src/
│       │   ├── Components/
│       │   ├── Pages/
│       │   ├── api/
│       │   └── App.jsx
│       └── package.json
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

* Node.js and npm
* MongoDB

### Backend

```bash
cd Code/Backend
npm install
node server.js
```

Configure the required environment variables in `Code/Backend/.env` before starting the backend.

Backend URL: `http://localhost:5000`

### Frontend

Open another terminal:

```bash
cd Code/Frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## 🔐 Security

The application uses JWT authentication, protected routes, and environment variables for sensitive configuration.

Environment files and local development scripts are excluded from version control.

## 🎯 Project Objective

To demonstrate full-stack web development through a movie ticket booking system with authentication, database integration, real-time seat management, payment integration, and an administrative dashboard.

## 📌 Project Information

**Project Name**
