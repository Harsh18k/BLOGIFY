const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host : process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
    secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((err, success) => {
    if (err) {
      console.error("Email server error:", err);
    } else {
      console.log("Email server ready");
    }
  });

module.exports = transporter;