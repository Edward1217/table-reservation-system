import { useEffect, useState } from "react";

import { Link, useParams, useSearchParams } from "react-router-dom";

import API_URL from "../utils/api";

function ReservationPage() {
  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [reservation, setReservation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [cancelling, setCancelling] = useState(false);

  // ===================================================
  // Load Reservation
  // ===================================================

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true);

        setError("");

        if (!token) {
          setError("Reservation not found.");

          return;
        }

        const response = await fetch(
          `${API_URL}/api/reservations/${id}?token=${encodeURIComponent(
            token,
          )}`,
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Reservation not found.");

          return;
        }

        setReservation(data);
      } catch (error) {
        console.error(error);

        setError("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id, token]);

  // ===================================================
  // Cancel Reservation
  // ===================================================

  const handleCancelReservation = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      setError("");

      setMessage("");

      const response = await fetch(
        `${API_URL}/api/reservations/${id}/customer-cancel?token=${encodeURIComponent(
          token,
        )}`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to cancel reservation.");

        return;
      }

      setReservation((currentReservation) => ({
        ...currentReservation,

        status: "cancelled",
      }));

      setMessage("Your reservation has been cancelled.");
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server.");
    } finally {
      setCancelling(false);
    }
  };

  // ===================================================
  // Loading
  // ===================================================

  if (loading) {
    return (
      <div className='reservation-result-page'>
        <div className='reservation-result-card'>
          <p className='reservation-loading'>Loading reservation...</p>
        </div>
      </div>
    );
  }

  // ===================================================
  // Error
  // ===================================================

  if (error && !reservation) {
    return (
      <div className='reservation-result-page'>
        <div className='reservation-result-card'>
          <div className='result-icon error'>!</div>

          <h1>Reservation Not Found</h1>

          <p className='result-description'>{error}</p>

          <Link className='back-reservation-link' to='/'>
            Make a Reservation
          </Link>
        </div>
      </div>
    );
  }

  // ===================================================
  // Reservation Status
  // ===================================================

  const isCancelled = reservation.status === "cancelled";

  // ===================================================
  // Format Date
  // ===================================================

  const startDate = new Date(reservation.start_time);

  const formattedDate = startDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className='reservation-result-page'>
      <div
        className={`reservation-result-card ${
          isCancelled ? "cancelled" : "confirmed"
        }`}
      >
        {/* ========================================= */}
        {/* Status */}
        {/* ========================================= */}

        <div
          className={`result-icon ${isCancelled ? "cancelled" : "confirmed"}`}
        >
          {isCancelled ? "!" : "✓"}
        </div>

        <h1 className='reservation-result-title'>
          {isCancelled ? "Reservation Cancelled" : "Reservation Confirmed!"}
        </h1>

        <p className='result-description'>
          {isCancelled
            ? "This reservation is no longer active."
            : "Your table has been reserved successfully."}
        </p>

        {/* ========================================= */}
        {/* Status Badge */}
        {/* ========================================= */}

        <div
          className={`reservation-status ${
            isCancelled ? "cancelled" : "confirmed"
          }`}
        >
          {isCancelled ? "Cancelled" : "Confirmed"}
        </div>

        {/* ========================================= */}
        {/* Reservation Details */}
        {/* ========================================= */}

        <div className='reservation-details'>
          <div className='detail-row'>
            <span className='detail-label'>Reservation ID</span>

            <span className='detail-value'>#{reservation.reservation_id}</span>
          </div>

          <div className='detail-row'>
            <span className='detail-label'>Name</span>

            <span className='detail-value'>{reservation.customer_name}</span>
          </div>

          <div className='detail-row'>
            <span className='detail-label'>Email</span>

            <span className='detail-value'>{reservation.email}</span>
          </div>

          <div className='detail-row'>
            <span className='detail-label'>Date</span>

            <span className='detail-value'>{formattedDate}</span>
          </div>

          <div className='detail-row'>
            <span className='detail-label'>Time</span>

            <span className='detail-value'>{formattedTime}</span>
          </div>

          <div className='detail-row'>
            <span className='detail-label'>Table</span>

            <span className='detail-value'>
              Table {reservation.table_number}
            </span>
          </div>

          <div className='detail-row'>
            <span className='detail-label'>Guests</span>

            <span className='detail-value'>{reservation.guest_count}</span>
          </div>
        </div>

        {/* ========================================= */}
        {/* Success Message After Cancellation */}
        {/* ========================================= */}

        {message && (
          <div className='reservation-message success'>
            <span className='message-icon'>✓</span>

            <span>{message}</span>
          </div>
        )}

        {/* ========================================= */}
        {/* Error */}
        {/* ========================================= */}

        {error && (
          <div className='reservation-message error'>
            <span className='message-icon'>!</span>

            <span>{error}</span>
          </div>
        )}

        {/* ========================================= */}
        {/* Actions */}
        {/* ========================================= */}

        <div className='reservation-actions'>
          {!isCancelled && (
            <button
              className='cancel-reservation-button'
              onClick={handleCancelReservation}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Reservation"}
            </button>
          )}

          <Link className='new-reservation-button' to='/'>
            Make Another Reservation
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ReservationPage;
