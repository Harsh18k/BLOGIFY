// const ejs = require("ejs");
// const path = require("path");
// const transporter = require("./mailer");

// async function sendOtpEmail(email, name, otp) {

//   const templatePath = path.resolve(
//     __dirname,
//     "../views/emails/otp.ejs"
//   );

//   const html = await ejs.renderFile(templatePath, {
//     name,
//     otp,
//   });

//   await transporter.sendMail({
//     from: `"Blogify" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your Blogify Verification Code",
//     html,
//   });
// }

// module.exports = sendOtpEmail;


//// 
const ejs = require("ejs");
const path = require("path");
const sendMail = require("./mailer"); //  mailer (API based)

async function sendOtpEmail(email, name, otp) {

  const templatePath = path.resolve(
    __dirname,
    "../views/emails/otp.ejs"
  );

  const html = await ejs.renderFile(templatePath, {
    name,
    otp,
  });

  
  sendMail({
    to: email,
    subject: "Your Blogify Verification Code",
    html,
  });
}

module.exports = sendOtpEmail;