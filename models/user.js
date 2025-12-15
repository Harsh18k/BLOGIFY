const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    fullName: { type: String, required: false },
    email: { type: String, required: true, unique: true, sparse: true },
    password: { type: String },
    googleId: { type: String },
    profileImageURL: { type: String, default: "/image/default.png" },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },

    // forgot passwrd ke liye
    resetOTP: { type: String },
    resetOTPExpiry: { type: Date },
    resetOTPAttempts: { type: Number, default: 0 },

    // premium ke liye 
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumSince: {
      type: Date,
    },
    planName: {
      type: String, // Monthly | 6 Months | 12 Months
    },
    planAmount: {
      type: Number, // 199 / 999 / 1799
    },
    planExpiryAt: {
      type: Date,
    },
    paymentId: {
      type: String, // razorpay_payment_id
    },
    orderId: {
      type: String, // razorpay_order_id
    },
    
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  // If password does not exist (Google OAuth user), skip hashing
  if (!this.password) return;

  // If password is not modified, skip hashing
  if (!this.isModified("password")) return;

  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
});

module.exports = model("User", userSchema);
