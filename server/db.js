const { Pool } = require("pg");

require("dotenv").config();

// =====================================================
// Database Configuration
// =====================================================

const isProduction = process.env.NODE_ENV === "production";

const pool = isProduction
  ? new Pool({
      connectionString: process.env.DATABASE_URL,

      ssl: {
        rejectUnauthorized: false,
      },
    })
  : new Pool({
      user: process.env.DB_USER,

      host: process.env.DB_HOST,

      database: process.env.DB_NAME,

      password: process.env.DB_PASSWORD,

      port: Number(process.env.DB_PORT),
    });

// =====================================================
// Database Connection Events
// =====================================================

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

// =====================================================
// Export
// =====================================================

module.exports = pool;
