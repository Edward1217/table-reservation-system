const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // 2. Find admin by email
    const result = await pool.query(
      `
      SELECT *
      FROM admins
      WHERE email = $1
      `,
      [email],
    );

    // 3. Admin not found
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const admin = result.rows[0];

    // 4. Compare password
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // 5. Create JWT
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: "admin",
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "2h",
      },
    );

    // 6. Send response
    res.json({
      message: "Login successful",

      token,

      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error",
    });
  }
};

module.exports = {
  loginAdmin,
};
