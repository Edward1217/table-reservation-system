const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
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
  const mailOptions = {
    from: process.env.EMAIL_USER,

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
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendReservationEmail;
