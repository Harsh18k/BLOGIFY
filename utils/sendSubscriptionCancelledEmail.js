// const ejs = require("ejs");
// const path = require("path");
// const transporter = require("./mailer");

// async function sendSubscriptionCancelledEmail({
//   email,
//   name,
//   planName,
//   cancelledAt,
// }) {
//   try {
//     const templatePath = path.join(
//       __dirname,
//       "../views/emails/subscription-cancelled.ejs"
//     );

//     const html = await ejs.renderFile(templatePath, {
//       name,
//       planName,
//       cancelledAt: cancelledAt.toDateString(),
//       year: new Date().getFullYear(),
//     });

//     await transporter.sendMail({
//       from: `"Blogify" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "❌ Your Blogify subscription has been cancelled",
//       html,
//     });

//   } catch (err) {
//     console.error("📧 Cancellation email failed:", err);
//   }
// }

// module.exports = sendSubscriptionCancelledEmail;


/// brevo based new 
const ejs = require("ejs");
const path = require("path");
const sendMail = require("./mailer"); // 👈 API-based mailer

async function sendSubscriptionCancelledEmail({
  email,
  name,
  planName,
  cancelledAt,
}) {
  try {
    const templatePath = path.join(
      __dirname,
      "../views/emails/subscription-cancelled.ejs"
    );

    const html = await ejs.renderFile(templatePath, {
      name,
      planName,
      cancelledAt: cancelledAt.toDateString(),
      year: new Date().getFullYear(),
    });

    // ❌ await mat lagana (non-blocking)
    sendMail({
      to: email,
      subject: "❌ Your Blogify subscription has been cancelled",
      html,
    });

  } catch (err) {
    console.error("📧 Cancellation email failed:", err);
  }
}

module.exports = sendSubscriptionCancelledEmail;