const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Blog = require("../models/blog");
const { generateToken, verifyToken } = require("../services/authentication");
const transporter = require("../utils/mailer");
const sendForgotPasswordOtp = require("../utils/sendOtpEmail");

const router = express.Router();
router.get("/signin", (req, res) => {
  return res.render("signin");
});
router.get("/signup", (req, res) => {
  return res.render("signup");
});
router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // CASE 1: Google OAuth user exists with this email
      if (existingUser.googleId) {
        return res.render("signin", {
          errorMessage:
            "This email is registered with Google. Please sign in using Google.",
        });
      }

      // CASE 2: Normal user exists
      return res.render("signin", {
        errorMessage: "Email already registered. Please sign in.",
      });
    }

    // CASE 3: No user → Create normal user
    await User.create({ fullName, email, password });

    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.render("signup", {
      errorMessage: "Something went wrong. Please try again.",
    });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      res.cookie("errorMessage", "Invalid email or password");
      return res.redirect("/user/signin");
    }

    // 2. If user is Google OAuth account → block normal signin
    if (user.googleId) {
      res.cookie(
        "errorMessage",
        "This email is registered with Google. Please sign in using Google."
      );
      return res.redirect("/user/signin");
    }

    // 3. Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.cookie("errorMessage", "Invalid email or password");
      return res.redirect("/user/signin");
    }

    // 4. Generate Token for normal users
    const token = generateToken(user);

    res.cookie("successMessage", "Signin successful!");
    return res.cookie("token", token).redirect("/");
  } catch (err) {
    console.error(err);
    res.cookie("errorMessage", "Something went wrong. Try again.");
    return res.redirect("/user/signin");
  }
});

router.get("/signout", (req, res) => {
  // Passport logout (for Google OAuth)
  req.logout(function (err) {
    if (err) {
      console.log("Logout error:", err);
    }

    // Destroy session if exists (for passport sessions)
    req.session?.destroy(() => {
      res.clearCookie("token"); // clear normal login token
      res.cookie("successMessage", "Signout successful!");
      return res.redirect("/");
    });
  });
});

//my profile route
router.get("/profile", (req, res) => {
  if (!req.user) return res.redirect("/user/signin");
  return res.render("profile", { user: req.user });
});

// sirf us specific user ka blog dekhne ke liye
// my blog
router.get("/my-blogs", async (req, res) => {
  if (!req.user) {
    return res.redirect("/user/signin");
  }
  const blogs = await Blog.find({ CREATED_BY: req.user._id }).sort({
    createdAt: -1,
  });
  res.render("my-blogs", {
    blogs,
  });
});

// password reset wla logic
router.get("/forgot-password", (req, res) => {
  return res.render("forgot-password");
});
router.get("/verify-otp", (req, res) => {
  const { email } = req.query;
  if (!email) return res.redirect("/user/forgot-password");
  res.render("verify-otp", { email });
});

router.get("/reset-password", (req, res) => {
  const { email } = req.query;
  if (!email) return res.redirect("/user/forgot-password");
  res.render("reset-password", { email });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.cookie("errorMessage", "Please enter your email");
      return res.redirect("/user/forgot-password");
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.cookie("errorMessage", "No account found with this email");
      return res.redirect("/user/forgot-password");
    }

    if (user.googleId) {
      res.cookie(
        "errorMessage",
        "This account was created using Google. Please login with Google."
      );
      return res.redirect("/user/signin");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
    user.resetOTPAttempts = 0;
    await user.save();

    // Styled email send
    await sendForgotPasswordOtp(email, user.fullName || "User", otp);

    res.redirect(`/user/verify-otp?email=${email}`);
  } catch (err) {
    console.error(err);
    res.cookie("errorMessage", "Something went wrong");
    res.redirect("/user/forgot-password");
  }
});

// verify otp
/* ================================
   VERIFY OTP
================================ */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Basic validation
    if (!email || !otp) {
      res.cookie("errorMessage", "Invalid request");
      return res.redirect("/user/forgot-password");
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      res.cookie("errorMessage", "User not found");
      return res.redirect("/user/forgot-password");
    }

    //  Google user protection
    if (user.googleId) {
      res.cookie(
        "errorMessage",
        "This account uses Google Sign-in. Please login with Google."
      );
      return res.redirect("/user/signin");
    }

    if (user.resetOTPAttempts >= 5) {
      res.cookie("errorMessage", "Too many attempts. Request new OTP.");
      return res.redirect("/user/forgot-password");
    }

    if (user.resetOTP !== otp) {
      user.resetOTPAttempts += 1;
      await user.save();
      res.cookie("errorMessage", "Invalid OTP");
      return res.redirect(`/user/verify-otp?email=${email}`);
    }

    // OTP expiry check
    if (user.resetOTPExpiry < Date.now()) {
      res.cookie("errorMessage", "OTP expired. Please request again.");
      return res.redirect("/user/forgot-password");
    }

    //  OTP verified → allow password reset
    user.resetOTPAttempts = 0;
    await user.save();
    res.redirect(`/user/reset-password?email=${email}`);
  } catch (error) {
    console.error(error);
    res.cookie("errorMessage", "Something went wrong");
    res.redirect("/user/forgot-password");
  }
});

// change password after otp verification
/* ================================
   RESET PASSWORD
================================ */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    //  Basic validation
    if (!email || !password) {
      res.cookie("errorMessage", "Invalid request");
      return res.redirect("/user/forgot-password");
    }

    //  Find user
    const user = await User.findOne({ email });

    if (!user) {
      res.cookie("errorMessage", "User not found");
      return res.redirect("/user/forgot-password");
    }

    //  Google user protection
    if (user.googleId) {
      res.cookie(
        "errorMessage",
        "This account uses Google Sign-in. Password reset not allowed."
      );
      return res.redirect("/user/signin");
    }

    //  Set new password
    user.password = password;

    //  Clear OTP fields
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    user.resetOTPAttempts = 0;

    // save user (bcrypt will hash password)
    await user.save();

    // 7️⃣ Success → signin
    res.cookie("successMessage", "Password reset successful. Please sign in.");
    res.redirect("/user/signin");
  } catch (error) {
    console.error(error);
    res.cookie("errorMessage", "Something went wrong");
    res.redirect("/user/forgot-password");
  }
});

// my profile se password change ke liye 

router.get("/change-password", async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/user/signin");
    }

    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      res.cookie("errorMessage", "User not found");
      return res.redirect("/user/profile");
    }

    if (user.googleId) {
      res.cookie(
        "errorMessage",
        "Google account users cannot change password here"
      );
      return res.redirect("/user/profile");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
    user.resetOTPAttempts = 0;
    await user.save();

    // Send OTP email
    await sendForgotPasswordOtp(
      email,
      user.fullName || "User",
      otp
    );

    // Direct OTP verification
    res.redirect(`/user/verify-otp?email=${email}`);

  } catch (err) {
    console.error(err);
    res.cookie("errorMessage", "Something went wrong");
    res.redirect("/user/profile");
  }
});

// my profile me my-plans ke lye 
router.get("/my-plans", async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  const user = await User.findById(req.user._id).lean();

  if (!user) return res.redirect("/user/signin");

  return res.render("my-plans", { user });
});

module.exports = router;
