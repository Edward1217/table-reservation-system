const express = require("express");

const {
  createReservation,
  getAllReservations,
  cancelReservation,
  getReservationById,
  updateReservation,
  customerCancelReservation,
} = require("../controllers/reservationController");

const authenticateAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// Customer - Create Reservation
// =====================================================

router.post("/", createReservation);

// =====================================================
// Admin - Get All Reservations
// =====================================================

router.get("/", authenticateAdmin, getAllReservations);

// =====================================================
// Customer - Cancel Own Reservation
// Requires access token
// =====================================================

router.patch("/:id/customer-cancel", customerCancelReservation);

// =====================================================
// Admin - Cancel Reservation
// Requires Admin JWT
// =====================================================

router.patch("/:id/cancel", authenticateAdmin, cancelReservation);

// =====================================================
// Customer - Get Own Reservation
// Requires access token
// =====================================================

router.get("/:id", getReservationById);

// =====================================================
// Admin - Edit Reservation
// Requires Admin JWT
// =====================================================

router.patch("/:id", authenticateAdmin, updateReservation);

module.exports = router;
