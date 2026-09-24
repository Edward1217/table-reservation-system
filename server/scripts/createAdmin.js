const bcrypt = require("bcrypt");
const pool = require("../db");

const createAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required",
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO admins
        (name, email, password_hash)
      VALUES
        ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        created_at
      `,
      [name, email, passwordHash],
    );

    console.log("Admin created:", result.rows[0]);
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await pool.end();
  }
};

createAdmin();
