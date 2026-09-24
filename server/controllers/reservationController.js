const pool = require("../db");
const hashAccessToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
const crypto = require("crypto");
const sendReservationEmail = require("../services/emailService");

// =====================================================
// 1. Create Reservation
// Customer
// =====================================================

const createReservation = async (req, res, next) => {
  const { name, email, tableId, date, time, guestCount } = req.body;

  // =================================================
  // Step 20-1
  // Required Fields Validation
  // =================================================

  if (
    !name ||
    !email ||
    !tableId ||
    !date ||
    !time ||
    guestCount === undefined ||
    guestCount === null
  ) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  // =================================================
  // Step 20-2
  // Email Validation
  // =================================================

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      error: "Invalid email address",
    });
  }

  // =================================================
  // Step 20-3
  // Date / Time Validation
  // =================================================

  const reservationDateTime = new Date(`${date}T${time}:00`);

  if (Number.isNaN(reservationDateTime.getTime())) {
    return res.status(400).json({
      error: "Invalid reservation date or time",
    });
  }

  const now = new Date();

  if (reservationDateTime <= now) {
    return res.status(400).json({
      error: "Reservation time must be in the future",
    });
  }

  // =================================================
  // Step 20-4
  // Guest Count Validation
  // =================================================

  const parsedGuestCount = Number(guestCount);

  if (!Number.isInteger(parsedGuestCount) || parsedGuestCount < 1) {
    return res.status(400).json({
      error: "Guest count must be a positive whole number",
    });
  }

  // =================================================
  // Database Connection
  // =================================================

  let client;

  try {
    client = await pool.connect();

    // ===============================================
    // Start Transaction
    // ===============================================

    await client.query("BEGIN");

    const startTime = `${date} ${time}:00`;

    // ===============================================
    // Find and Lock Table
    // ===============================================

    const tableResult = await client.query(
      `
          SELECT *
          FROM restaurant_tables

          WHERE id = $1
            AND is_active = true

          FOR UPDATE
          `,
      [tableId],
    );

    if (tableResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Table not found or inactive",
      });
    }

    const table = tableResult.rows[0];

    // ===============================================
    // Table Capacity Validation
    // ===============================================

    if (parsedGuestCount > table.capacity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: `Table capacity is ${table.capacity}`,
      });
    }

    // ===============================================
    // Reservation Conflict Check
    //
    // new_start < existing_end
    //
    // AND
    //
    // new_end > existing_start
    // ===============================================

    const conflictResult = await client.query(
      `
          SELECT id
          FROM reservations

          WHERE table_id = $1

            AND status = 'confirmed'

            AND $2::timestamp
                < end_time

            AND (
              $2::timestamp
              + INTERVAL '90 minutes'
            ) > start_time

          FOR UPDATE
          `,
      [tableId, startTime],
    );

    if (conflictResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "This table is already reserved for the selected time",
      });
    }

    // ===============================================
    // Create Customer
    // ===============================================

    const customerResult = await client.query(
      `
          INSERT INTO customers
          (
            name,
            email
          )

          VALUES
          (
            $1,
            $2
          )

          RETURNING *
          `,
      [name.trim(), email.trim()],
    );

    const customer = customerResult.rows[0];

    // ===============================================
    // Generate Customer Access Token
    // ===============================================

    const accessToken = crypto.randomBytes(32).toString("hex");

    // ===============================================
    // Create Reservation
    // ===============================================

    const reservationResult = await client.query(
      `
          INSERT INTO reservations
          (
            customer_id,
            table_id,
            start_time,
            end_time,
            guest_count,
            status,
            access_token
          )

          VALUES
          (
            $1,
            $2,
            $3::timestamp,
            $3::timestamp
              + INTERVAL '90 minutes',
            $4,
            'confirmed',
            $5
          )

          RETURNING *
          `,
      [customer.id, tableId, startTime, parsedGuestCount, accessToken],
    );

    const reservation = reservationResult.rows[0];

    // ===============================================
    // Commit
    // ===============================================

    await client.query("COMMIT");

    // ===============================================
    // Send Confirmation Email
    //
    // IMPORTANT:
    //
    // Reservation has already been COMMITTED.
    //
    // Email failure must NOT rollback reservation.
    // ===============================================

    try {
      await sendReservationEmail({
        email: email.trim(),

        name: name.trim(),

        tableNumber: table.table_number,

        date,

        time,

        guestCount: parsedGuestCount,

        reservationId: reservation.id,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

    // ===============================================
    // Success Response
    // ===============================================

    return res.status(201).json({
      message: "Reservation created successfully!",

      customer,

      reservation,
    });
  } catch (error) {
    // ===============================================
    // Rollback Database Transaction
    // ===============================================

    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    // ===============================================
    // Send unexpected error to Global Error Handler
    // ===============================================

    next(error);
  } finally {
    // ===============================================
    // Release Database Connection
    // ===============================================

    if (client) {
      client.release();
    }
  }
};

// =====================================================
// 2. Get All Reservations
// Admin Only
// =====================================================

const getAllReservations = async (req, res, next) => {
  try {
    const { name, status, date } = req.query;

    let query = `
        SELECT
          r.id
            AS reservation_id,

          c.name
            AS customer_name,

          c.email,

          r.table_id,

          t.table_number,

          r.start_time,

          r.end_time,

          r.guest_count,

          r.status

        FROM reservations r

        JOIN customers c
          ON r.customer_id = c.id

        JOIN restaurant_tables t
          ON r.table_id = t.id

        WHERE 1 = 1
      `;

    const values = [];

    // Search by name

    if (name) {
      values.push(`%${name}%`);

      query += `
          AND c.name
          ILIKE $${values.length}
        `;
    }

    // Filter by status

    if (status) {
      values.push(status);

      query += `
          AND r.status
          = $${values.length}
        `;
    }

    // Filter by date

    if (date) {
      values.push(date);

      query += `
          AND r.start_time::date
          = $${values.length}
        `;
    }

    query += `
        ORDER BY r.start_time
      `;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 3. Get Reservation By ID
// Customer
//
// Requires:
// Reservation ID + Access Token
// =====================================================

const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { token } = req.query;

    if (!token) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    const result = await pool.query(
      `
          SELECT

            r.id
              AS reservation_id,

            c.name
              AS customer_name,

            c.email,

            t.table_number,

            t.capacity,

            r.start_time,

            r.end_time,

            r.guest_count,

            r.status

          FROM reservations r

          JOIN customers c
            ON r.customer_id = c.id

          JOIN restaurant_tables t
            ON r.table_id = t.id

          WHERE r.id = $1

            AND r.access_token = $2
          `,
      [id, token],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 4. Update Reservation
// Admin Only
// =====================================================

const updateReservation = async (req, res, next) => {
  const { id } = req.params;

  const { tableId, date, time, guestCount } = req.body;

  // ===============================================
  // Required Fields Validation
  // ===============================================

  if (
    !tableId ||
    !date ||
    !time ||
    guestCount === undefined ||
    guestCount === null
  ) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  // ===============================================
  // Guest Count Validation
  // ===============================================

  const parsedGuestCount = Number(guestCount);

  if (!Number.isInteger(parsedGuestCount) || parsedGuestCount < 1) {
    return res.status(400).json({
      error: "Guest count must be a positive whole number",
    });
  }

  // ===============================================
  // Date / Time Validation
  // ===============================================

  const reservationDateTime = new Date(`${date}T${time}:00`);

  if (Number.isNaN(reservationDateTime.getTime())) {
    return res.status(400).json({
      error: "Invalid reservation date or time",
    });
  }

  if (reservationDateTime <= new Date()) {
    return res.status(400).json({
      error: "Reservation time must be in the future",
    });
  }

  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const startTime = `${date} ${time}:00`;

    // ===============================================
    // Find Reservation
    // ===============================================

    const reservationResult = await client.query(
      `
          SELECT *
          FROM reservations

          WHERE id = $1

          FOR UPDATE
          `,
      [id],
    );

    if (reservationResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    const currentReservation = reservationResult.rows[0];

    // ===============================================
    // Cancelled Reservation Cannot Be Edited
    // ===============================================

    if (currentReservation.status === "cancelled") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Cancelled reservation cannot be edited",
      });
    }

    // ===============================================
    // Find Table
    // ===============================================

    const tableResult = await client.query(
      `
          SELECT *
          FROM restaurant_tables

          WHERE id = $1

            AND is_active = true

          FOR UPDATE
          `,
      [tableId],
    );

    if (tableResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Table not found or inactive",
      });
    }

    const table = tableResult.rows[0];

    // ===============================================
    // Capacity Check
    // ===============================================

    if (parsedGuestCount > table.capacity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: `Table capacity is ${table.capacity}`,
      });
    }

    // ===============================================
    // Conflict Check
    //
    // id <> $2
    //
    // Ignore the reservation currently being edited.
    // ===============================================

    const conflictResult = await client.query(
      `
          SELECT id

          FROM reservations

          WHERE table_id = $1

            AND status = 'confirmed'

            AND id <> $2

            AND $3::timestamp
                < end_time

            AND (
              $3::timestamp
              + INTERVAL '90 minutes'
            ) > start_time
          `,
      [tableId, id, startTime],
    );

    if (conflictResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "This table is already reserved for the selected time",
      });
    }

    // ===============================================
    // Update Reservation
    // ===============================================

    const updateResult = await client.query(
      `
          UPDATE reservations

          SET
            table_id = $1,

            start_time =
              $2::timestamp,

            end_time =
              $2::timestamp
              + INTERVAL '90 minutes',

            guest_count = $3

          WHERE id = $4

          RETURNING *
          `,
      [tableId, startTime, parsedGuestCount, id],
    );

    await client.query("COMMIT");

    res.json({
      message: "Reservation updated successfully!",

      reservation: updateResult.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// =====================================================
// 5. Cancel Reservation
// Admin Only
// =====================================================

const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
          UPDATE reservations

          SET status = 'cancelled'

          WHERE id = $1

            AND status = 'confirmed'

          RETURNING *
          `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Reservation not found or already cancelled",
      });
    }

    res.json({
      message: "Reservation cancelled successfully!",

      reservation: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// 6. Customer Cancel Reservation
//
// Requires:
// Reservation ID + Access Token
// =====================================================

const customerCancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { token } = req.query;

    if (!token) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    const result = await pool.query(
      `
          UPDATE reservations

          SET status = 'cancelled'

          WHERE id = $1

            AND access_token = $2

            AND status = 'confirmed'

          RETURNING
            id,
            table_id,
            start_time,
            end_time,
            guest_count,
            status
          `,
      [id, token],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Reservation not found or already cancelled",
      });
    }

    res.json({
      message: "Reservation cancelled successfully!",

      reservation: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// Export Controllers
// =====================================================

module.exports = {
  createReservation,

  getAllReservations,

  getReservationById,

  updateReservation,

  cancelReservation,

  customerCancelReservation,
};
