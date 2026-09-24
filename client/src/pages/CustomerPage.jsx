import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import API_URL from "../utils/api";

function CustomerPage() {
  const navigate = useNavigate();

  // ===================================================
  // Form State
  // ===================================================

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [date, setDate] = useState("");

  const [time, setTime] = useState("");

  const [guestCount, setGuestCount] = useState(1);

  const [selectedTable, setSelectedTable] = useState(null);

  // ===================================================
  // Table State
  // ===================================================

  const [tables, setTables] = useState([]);

  // ===================================================
  // UI State
  // ===================================================

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // ===================================================
  // Load All Tables
  // ===================================================

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tables`);

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Unable to load tables.");

          return;
        }

        setTables(data);
      } catch (error) {
        console.error(error);

        setMessage("Unable to connect to server.");
      }
    };

    fetchTables();
  }, []);

  // ===================================================
  // Check Table Availability
  // ===================================================

  const checkAvailability = async () => {
    setMessage("");
    setSelectedTable(null);

    // -------------------------------------------------
    // Date / Time Required
    // -------------------------------------------------

    if (!date || !time) {
      setMessage("Please select a date and time.");

      return;
    }

    // -------------------------------------------------
    // Date / Time Validation
    // -------------------------------------------------

    const reservationDateTime = new Date(`${date}T${time}:00`);

    if (Number.isNaN(reservationDateTime.getTime())) {
      setMessage("Please select a valid date and time.");

      return;
    }

    if (reservationDateTime <= new Date()) {
      setMessage("Reservation time must be in the future.");

      return;
    }

    try {
      setCheckingAvailability(true);

      const response = await fetch(
        `${API_URL}/api/tables/available?date=${encodeURIComponent(
          date,
        )}&time=${encodeURIComponent(time)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to check availability.");

        return;
      }

      setTables(data);
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to server.");
    } finally {
      setCheckingAvailability(false);
    }
  };

  // ===================================================
  // Select Table
  // ===================================================

  const handleTableSelect = (table) => {
    if (table.available === false) {
      return;
    }

    setSelectedTable(table.id);

    setMessage("");
  };

  // ===================================================
  // Create Reservation
  // ===================================================

  const handleReservation = async (event) => {
    event.preventDefault();

    setMessage("");

    // =================================================
    // Step 20-5
    // Frontend Validation
    // =================================================

    // -------------------------------------------------
    // 1. Required Fields
    // -------------------------------------------------

    if (
      !name.trim() ||
      !email.trim() ||
      !selectedTable ||
      !date ||
      !time ||
      guestCount === "" ||
      guestCount === null ||
      guestCount === undefined
    ) {
      setMessage("Please fill in all fields.");

      return;
    }

    // -------------------------------------------------
    // 2. Email Validation
    // -------------------------------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email address.");

      return;
    }

    // -------------------------------------------------
    // 3. Guest Count Validation
    // -------------------------------------------------

    const parsedGuestCount = Number(guestCount);

    if (!Number.isInteger(parsedGuestCount) || parsedGuestCount < 1) {
      setMessage("Guest count must be a positive whole number.");

      return;
    }

    // -------------------------------------------------
    // 4. Date / Time Validation
    // -------------------------------------------------

    const reservationDateTime = new Date(`${date}T${time}:00`);

    if (Number.isNaN(reservationDateTime.getTime())) {
      setMessage("Please select a valid date and time.");

      return;
    }

    if (reservationDateTime <= new Date()) {
      setMessage("Reservation time must be in the future.");

      return;
    }

    // =================================================
    // Send Reservation To Backend
    // =================================================

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name.trim(),

          email: email.trim(),

          tableId: selectedTable,

          date,

          time,

          guestCount: parsedGuestCount,
        }),
      });

      const data = await response.json();

      // =================================================
      // Backend Error
      // =================================================

      if (!response.ok) {
        setMessage(data.error || "Unable to create reservation.");

        return;
      }

      // =================================================
      // Reservation Created
      // =================================================

      const reservationId = data.reservation.id;

      const accessToken = data.reservation.access_token;

      // Safety check

      if (!reservationId || !accessToken) {
        setMessage(
          "Reservation was created, but reservation information is incomplete.",
        );

        return;
      }

      // =================================================
      // Go To Reservation Confirmation Page
      // =================================================

      navigate(
        `/reservation/${reservationId}?token=${encodeURIComponent(
          accessToken,
        )}`,
      );
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className='customer-page'>
      <div className='reservation-container'>
        <div className='reservation-header'>
          <h1>Restaurant Reservation</h1>

          <p>Choose your date, time, and table to make a reservation.</p>
        </div>

        <form className='reservation-form' onSubmit={handleReservation}>
          <section className='reservation-section'>
            <h2>Reservation Details</h2>

            <div className='form-grid'>
              {/* Name */}
              <div className='form-group'>
                <label>Name</label>

                <input
                  type='text'
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder='Your name'
                />
              </div>

              {/* Email */}
              <div className='form-group'>
                <label>Email</label>

                <input
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder='Your email'
                />
              </div>

              {/* Date */}
              <div className='form-group'>
                <label>Date</label>

                <input
                  type='date'
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setSelectedTable(null);
                  }}
                />
              </div>

              {/* Time */}
              <div className='form-group'>
                <label>Time</label>

                <input
                  type='time'
                  value={time}
                  onChange={(event) => {
                    setTime(event.target.value);
                    setSelectedTable(null);
                  }}
                />
              </div>

              {/* Guests */}
              <div className='form-group'>
                <label>Guests</label>

                <input
                  type='number'
                  min='1'
                  step='1'
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                />
              </div>
            </div>

            <button
              className='availability-button'
              type='button'
              onClick={checkAvailability}
              disabled={checkingAvailability}
            >
              {checkingAvailability ? "Checking..." : "Check Availability"}
            </button>
          </section>

          <section className='reservation-section'>
            <h2>Select a Table</h2>

            <div className='table-grid'>
              {tables.map((table) => {
                const isUnavailable = table.available === false;

                const isSelected = selectedTable === table.id;

                let tableClass = "table-card available";

                if (isUnavailable) {
                  tableClass = "table-card reserved";
                }

                if (isSelected) {
                  tableClass = "table-card selected";
                }

                return (
                  <button
                    type='button'
                    key={table.id}
                    disabled={isUnavailable}
                    onClick={() => handleTableSelect(table)}
                    className={tableClass}
                  >
                    <div className='table-card-header'>
                      <span className='table-number'>
                        Table {table.table_number}
                      </span>

                      <span
                        className={`status-badge ${
                          isUnavailable
                            ? "reserved"
                            : isSelected
                              ? "selected"
                              : "available"
                        }`}
                      >
                        {isUnavailable
                          ? "Reserved"
                          : isSelected
                            ? "Selected"
                            : "Available"}
                      </span>
                    </div>

                    <div className='table-capacity'>
                      Capacity: <strong>{table.capacity}</strong> Guests
                    </div>

                    {isSelected && (
                      <div className='selected-indicator'>✓ Your Selection</div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {message && <div className='reservation-message'>{message}</div>}

          <button className='reserve-button' type='submit' disabled={loading}>
            {loading ? "Reserving..." : "Reserve Table"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomerPage;
