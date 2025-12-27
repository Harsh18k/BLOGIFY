// const nodemailer = require("nodemailer");
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//   host : process.env.EMAIL_HOST,
//   port: Number(process.env.EMAIL_PORT),
//     secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });
// transporter.verify((err, success) => {
//     if (err) {
//       console.error("Email server error:", err);
//     } else {
//       console.log("Email server ready");
//     }
//   });

// module.exports = transporter;



/// brevo api based implement krte hai aab yha se 
const axios = require("axios");

async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Blogify",
          email: process.env.EMAIL_FROM,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(attachments.length > 0 && { attachment: attachments }),
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
  } catch (error) {
    console.error(
      "📧 Brevo Email Error:",
      error.response?.data || error.message
    );
  }
}

module.exports = sendMail;