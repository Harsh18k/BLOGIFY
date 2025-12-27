// const ejs = require("ejs");
// const path = require("path");
// const transporter = require("./mailer");

// async function sendPaymentSuccessEmail({
//   email,
//   name,
//   planName,
//   amount,
//   paymentId,
//   expiryDate,

//   invoiceNumber = "",
//   invoiceViewUrl = "",
//   supportEmail = "kushwahaharsh98@gmail.com",

//   attachments = [],
// }) {
//   try {
//     const templatePath = path.join(
//       __dirname,
//       "../views/emails/payment-success.ejs"
//     );

//     const html = await ejs.renderFile(templatePath, {
//       name,
//       planName,
//       amount,
//       paymentId,
//       expiryDate,
//       invoiceNumber,
//       invoiceViewUrl,
//       supportEmail,
//       date: new Date().toDateString(),
//     });

//     const mailOptions = {
//       from: `"Blogify" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: invoiceNumber
//         ? `🎉 Payment Successful | Invoice ${invoiceNumber}`
//         : "🎉 Blogify Premium Activated",
//       html,
//     };

//     // ✅ attach ONLY if buffer exists & non-empty
//     if (
//       attachments &&
//       attachments.length > 0 &&
//       attachments[0].content &&
//       attachments[0].content.length > 0
//     ) {
//       mailOptions.attachments = attachments;
//     }

//     await transporter.sendMail(mailOptions);

//     console.log("✅ Payment success email sent to:", email);

//   } catch (err) {
//     console.error("📧 Payment email failed FULL ERROR:", err);
//   }
// }

// module.exports = sendPaymentSuccessEmail;



////// new one 
const ejs = require("ejs");
const path = require("path");
const sendMail = require("./mailer"); // 👈 API-based mailer

async function sendPaymentSuccessEmail({
  email,
  name,
  planName,
  amount,
  paymentId,
  expiryDate,

  invoiceNumber = "",
  invoiceViewUrl = "",
  supportEmail = "kushwahaharsh98@gmail.com",

  attachments = [],
}) {
  try {
    const templatePath = path.join(
      __dirname,
      "../views/emails/payment-success.ejs"
    );

    const html = await ejs.renderFile(templatePath, {
      name,
      planName,
      amount,
      paymentId,
      expiryDate,
      invoiceNumber,
      invoiceViewUrl,
      supportEmail,
      date: new Date().toDateString(),
    });

    // 🔁 Convert attachments (Buffer → Base64)
    let apiAttachments = [];

    if (
      attachments &&
      attachments.length > 0 &&
      attachments[0].content &&
      attachments[0].content.length > 0
    ) {
      apiAttachments = attachments.map((att) => ({
        name: att.filename,
        content: att.content.toString("base64"),
      }));
    }

    // ❌ await mat lagana (non-blocking)
    sendMail({
      to: email,
      subject: invoiceNumber
        ? `🎉 Payment Successful | Invoice ${invoiceNumber}`
        : "🎉 Blogify Premium Activated",
      html,
      attachments: apiAttachments,
    });

    console.log("✅ Payment success email triggered for:", email);

  } catch (err) {
    console.error("📧 Payment email failed:", err);
  }
}

module.exports = sendPaymentSuccessEmail;