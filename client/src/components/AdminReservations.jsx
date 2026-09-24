import { useEffect, useState } from "react";

import API_URL, { adminFetch } from "../utils/api";

function AdminReservations() {
  // ===================================================
  // Reservation / Table Data
  // ===================================================

  const [reservations, setReservations] = useState([]);

  const [tables, setTables] = useState([]);

  // ===================================================
  // Filters
  // ===================================================

  const [nameFilter, setNameFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [dateFilter, setDateFilter] = useState("");

  // ===================================================
  // Edit Reservation
  // ===================================================

  const [editingReservation, setEditingReservation] = useState(null);

  const [editTableId, setEditTableId] = useState("");

  const [editDate, setEditDate] = useState("");

  const [editTime, setEditTime] = useState("");

  const [editGuestCount, setEditGuestCount] = useState("");

  // ===================================================
  // UI
  // ===================================================

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("info");

  const [loading, setLoading] = useState(true);

  // ===================================================
  // Initial Load
  // ===================================================

  useEffect(() => {
    fetchReservations();

    fetchTables();
  }, []);

  // ===================================================
  // Fetch Reservations
  // ===================================================

  const fetchReservations = async (filters = {}) => {
    try {
      setLoading(true);

      setMessage("");

      const params = new URLSearchParams();

      if (filters.name) {
        params.append("name", filters.name);
      }

      if (filters.status) {
        params.append("status", filters.status);
      }

      if (filters.date) {
        params.append("date", filters.date);
      }

      const queryString = params.toString();

      const endpoint = queryString
        ? `/api/reservations?${queryString}`
        : "/api/reservations";

      const response = await adminFetch(endpoint);

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");

        setMessage(data.error || "Unable to load reservations.");

        return;
      }

      setReservations(data);
    } catch (error) {
      console.error(error);

      if (error.message !== "Authentication expired") {
        setMessageType("error");

        setMessage("Unable to load reservations.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // Fetch Tables
  // ===================================================

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tables`);

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");

        setMessage(data.error || "Unable to load tables.");

        return;
      }

      setTables(data);
    } catch (error) {
      console.error(error);

      setMessageType("error");

      setMessage("Unable to load tables.");
    }
  };

  // ===================================================
  // Search
  // ===================================================

  const handleSearch = () => {
    fetchReservations({
      name: nameFilter.trim(),

      status: statusFilter,

      date: dateFilter,
    });
  };

  // ===================================================
  // Clear Filters
  // ===================================================

  const clearFilters = async () => {
    setNameFilter("");

    setStatusFilter("");

    setDateFilter("");

    setMessage("");

    await fetchReservations();
  };

  // ===================================================
  // Cancel Reservation
  // Admin
  // ===================================================

  const cancelReservation = async (reservationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const response = await adminFetch(
        `/api/reservations/${reservationId}/cancel`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");

        setMessage(data.error || "Unable to cancel reservation.");

        return;
      }

      setMessageType("success");

      setMessage("Reservation cancelled successfully.");

      await fetchReservations({
        name: nameFilter.trim(),

        status: statusFilter,

        date: dateFilter,
      });
    } catch (error) {
      console.error(error);

      if (error.message !== "Authentication expired") {
        setMessageType("error");

        setMessage("Unable to cancel reservation.");
      }
    }
  };

  // ===================================================
  // Start Edit
  // ===================================================

  const startEdit = (reservation) => {
    setMessage("");

    const startTime = new Date(reservation.start_time);

    // Convert to local YYYY-MM-DD

    const year = startTime.getFullYear();

    const month = String(startTime.getMonth() + 1).padStart(2, "0");

    const day = String(startTime.getDate()).padStart(2, "0");

    // Convert to local HH:mm

    const hours = String(startTime.getHours()).padStart(2, "0");

    const minutes = String(startTime.getMinutes()).padStart(2, "0");

    setEditingReservation(reservation);

    setEditTableId(String(reservation.table_id));

    setEditDate(`${year}-${month}-${day}`);

    setEditTime(`${hours}:${minutes}`);

    setEditGuestCount(String(reservation.guest_count));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ===================================================
  // Close Edit
  // ===================================================

  const closeEdit = () => {
    setEditingReservation(null);

    setEditTableId("");

    setEditDate("");

    setEditTime("");

    setEditGuestCount("");
  };

  // ===================================================
  // Save Edit
  // ===================================================

  const saveEdit = async (event) => {
    event.preventDefault();

    if (!editingReservation) {
      return;
    }

    // -------------------------------------------------
    // Frontend Validation
    // -------------------------------------------------

    if (!editTableId || !editDate || !editTime || editGuestCount === "") {
      setMessageType("error");

      setMessage("All edit fields are required.");

      return;
    }

    const parsedGuestCount = Number(editGuestCount);

    if (!Number.isInteger(parsedGuestCount) || parsedGuestCount < 1) {
      setMessageType("error");

      setMessage("Guest count must be a positive whole number.");

      return;
    }

    const reservationDateTime = new Date(`${editDate}T${editTime}:00`);

    if (Number.isNaN(reservationDateTime.getTime())) {
      setMessageType("error");

      setMessage("Invalid reservation date or time.");

      return;
    }

    if (reservationDateTime <= new Date()) {
      setMessageType("error");

      setMessage("Reservation time must be in the future.");

      return;
    }

    try {
      setMessage("");

      const response = await adminFetch(
        `/api/reservations/${editingReservation.reservation_id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            tableId: Number(editTableId),

            date: editDate,

            time: editTime,

            guestCount: parsedGuestCount,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");

        setMessage(data.error || "Unable to update reservation.");

        return;
      }

      setMessageType("success");

      setMessage("Reservation updated successfully.");

      closeEdit();

      await fetchReservations({
        name: nameFilter.trim(),

        status: statusFilter,

        date: dateFilter,
      });
    } catch (error) {
      console.error(error);

      if (error.message !== "Authentication expired") {
        setMessageType("error");

        setMessage("Unable to update reservation.");
      }
    }
  };

  // ===================================================
  // Format Date / Time
  // ===================================================

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);

    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className='admin-reservations'>
      {/* =================================================
          Message
      ================================================== */}

      {message && (
        <div className={`reservation-message ${messageType}`} role='alert'>
          <span className='message-icon'>
            {messageType === "error"
              ? "!"
              : messageType === "success"
                ? "✓"
                : "i"}
          </span>

          <span>{message}</span>
        </div>
      )}

      {/* =================================================
          Edit Reservation
      ================================================== */}

      {editingReservation && (
        <div className='edit-reservation'>
          <h3>Edit Reservation #{editingReservation.reservation_id}</h3>

          <form onSubmit={saveEdit}>
            {/* Table */}

            <label>Table</label>

            <select
              value={editTableId}
              onChange={(event) => setEditTableId(event.target.value)}
            >
              <option value=''>Select Table</option>

              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Table {table.table_number} (Capacity: {table.capacity})
                </option>
              ))}
            </select>

            {/* Date */}

            <label>Date</label>

            <input
              type='date'
              value={editDate}
              onChange={(event) => setEditDate(event.target.value)}
            />

            {/* Time */}

            <label>Time</label>

            <input
              type='time'
              value={editTime}
              onChange={(event) => setEditTime(event.target.value)}
            />

            {/* Guests */}

            <label>Guests</label>

            <input
              type='number'
              min='1'
              step='1'
              value={editGuestCount}
              onChange={(event) => setEditGuestCount(event.target.value)}
            />

            <div>
              <button type='submit'>Save Changes</button>

              <button type='button' onClick={closeEdit}>
                Cancel Edit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================
          Search / Filters
      ================================================== */}

      <div className='admin-filter-card'>
        <div className='admin-filters'>
          {/* Customer Name */}

          <input
            type='text'
            placeholder='Customer name'
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
          />

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value=''>All Statuses</option>

            <option value='confirmed'>Confirmed</option>

            <option value='cancelled'>Cancelled</option>
          </select>

          {/* Date */}

          <input
            type='date'
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />

          {/* Search */}

          <button type='button' onClick={handleSearch}>
            Search
          </button>

          {/* Clear */}

          <button type='button' onClick={clearFilters}>
            Clear
          </button>
        </div>
      </div>

      {/* =================================================
          Loading
      ================================================== */}

      {loading && <p>Loading reservations...</p>}

      {/* =================================================
          Reservation Table
      ================================================== */}

      {!loading && (
        <div className='admin-table-card'>
          <div className='admin-table-wrapper'>
            <table className='reservation-table'>
              <thead>
                <tr>
                  <th>ID</th>

                  <th>Customer</th>

                  <th>Email</th>

                  <th>Table</th>

                  <th>Start Time</th>

                  <th>End Time</th>

                  <th>Guests</th>

                  <th>Status</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td
                      colSpan='9'
                      style={{
                        textAlign: "center",
                      }}
                    >
                      No reservations found.
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => (
                    <tr key={reservation.reservation_id}>
                      {/* ID */}

                      <td>{reservation.reservation_id}</td>

                      {/* Customer */}

                      <td>{reservation.customer_name}</td>

                      {/* Email */}

                      <td>{reservation.email}</td>

                      {/* Table */}

                      <td>Table {reservation.table_number}</td>

                      {/* Start */}

                      <td>{formatDateTime(reservation.start_time)}</td>

                      {/* End */}

                      <td>{formatDateTime(reservation.end_time)}</td>

                      {/* Guests */}

                      <td>{reservation.guest_count}</td>

                      {/* Status */}

                      <td>
                        <span
                          className={`admin-status-badge ${reservation.status}`}
                        >
                          {reservation.status}
                        </span>
                      </td>

                      {/* Actions */}

                      <td>
                        <div className='admin-actions'>
                          {reservation.status === "confirmed" && (
                            <>
                              <button
                                type='button'
                                className='admin-edit-button'
                                onClick={() => startEdit(reservation)}
                              >
                                Edit
                              </button>

                              <button
                                type='button'
                                className='admin-cancel-button'
                                onClick={() =>
                                  cancelReservation(reservation.reservation_id)
                                }
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReservations;
