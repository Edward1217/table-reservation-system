const pool = require("../db");

// GET /api/tables
const getAllTables = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM restaurant_tables
      ORDER BY table_number
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Database error",
    });
  }
};

// GET /api/tables/available
const getAvailableTables = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        error: "Date and time are required",
      });
    }

    const startTime = `${date} ${time}:00`;

    const result = await pool.query(
      `
      SELECT
        t.*,

        NOT EXISTS (
          SELECT 1
          FROM reservations r

          WHERE r.table_id = t.id

            AND r.status = 'confirmed'

            AND $1::timestamp < r.end_time

            AND
            ($1::timestamp + INTERVAL '90 minutes')
            > r.start_time

        ) AS available

      FROM restaurant_tables t

      WHERE t.is_active = true

      ORDER BY t.table_number
      `,
      [startTime],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Database error",
    });
  }
};

module.exports = {
  getAllTables,
  getAvailableTables,
};
