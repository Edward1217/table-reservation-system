const nodemailer = require("nodemailer");
require("dotenv").config();

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  // Force IPv4
  family: 4,

  // Connection timeout settings
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const sendReservationEmail = async ({
  email,
  name,
  tableNumber,
  date,
  time,
  guestCount,
  reservationId,
}) => {
  try {
    console.log(`Attempting to send reservation email to: ${email}`);

    const mailOptions = {
      from: `"Restaurant Reservation" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reservation Confirmation",

      text: `
Hi ${name},

Your reservation has been confirmed!

Reservation ID: ${reservationId}

Table: ${tableNumber}
Date: ${date}
Time: ${time}
Guests: ${guestCount}

Thank you for your reservation.

Restaurant Reservation System
      `,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          "
        >
          <h2>
            Reservation Confirmed
          </h2>

          <p>
            Hi ${name},
          </p>

          <p>
            Your reservation has been
            successfully confirmed.
          </p>

          <div
            style="
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            "
          >
            <p>
              <strong>
                Reservation ID:
              </strong>
              ${reservationId}
            </p>

            <p>
              <strong>Table:</strong>
              ${tableNumber}
            </p>

            <p>
              <strong>Date:</strong>
              ${date}
            </p>

            <p>
              <strong>Time:</strong>
              ${time}
            </p>

            <p>
              <strong>Guests:</strong>
              ${guestCount}
            </p>
          </div>

          <p>
            Thank you for your reservation.
          </p>

          <p>
            Restaurant Reservation System
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("Email error:", error);

    throw error;
  }
};

module.exports = sendReservationEmail;
