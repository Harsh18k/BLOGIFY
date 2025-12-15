const express = require("express");
const router = express.Router();
const User = require("../models/user");
const sendSubscriptionCancelledEmail = require("../utils/sendSubscriptionCancelledEmail");

function requireAuth(req, res, next) {
  if (!req.user) return res.redirect("/user/signin");
  next();
}

router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const cancelledAt = new Date();

    // pehle user data le lo (important for email)
    const existingUser = await User.findById(req.user._id);

    await User.findByIdAndUpdate(req.user._id, {
      isPremium: false,
      planName: null,
      planAmount: null,
      planExpiryAt: null,
      premiumSince: null,
    });

    // 📧 SEND CANCELLATION EMAIL (FIXED)
    await sendSubscriptionCancelledEmail({
      email: existingUser.email,
      name: existingUser.fullName || "User",
      planName: existingUser.planName || "Premium Plan",
      cancelledAt,
    });

    res.redirect("/user/my-plans");
  } catch (err) {
    console.error("❌ Subscription cancel error:", err);
    res.redirect("/user/my-plans");
  }
});

module.exports = router;