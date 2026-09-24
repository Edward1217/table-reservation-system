require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const tableRoutes = require("./routes/tableRoutes");

const reservationRoutes = require("./routes/reservationRoutes");

const authRoutes = require("./routes/authRoutes");

const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// =====================================================
// Environment Variables
// =====================================================

const PORT = process.env.PORT || 5000;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// =====================================================
// Security Middleware
// =====================================================

app.use(helmet());

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: CLIENT_URL,
  }),
);

// =====================================================
// Body Parser
// =====================================================

app.use(
  express.json({
    limit: "100kb",
  }),
);

// =====================================================
// Root Route
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Table Reservation API is running!",
  });
});

// =====================================================
// API Routes
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/tables", tableRoutes);

app.use("/api/reservations", reservationRoutes);

// =====================================================
// Global Error Handler
// =====================================================

app.use(errorHandler);

// =====================================================
// Start Server
// =====================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  console.log(`Allowed client: ${CLIENT_URL}`);
});
