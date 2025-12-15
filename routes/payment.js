const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const razorpay = require("../utils/razorpay");
const User = require("../models/user");
const sendPaymentSuccessEmail = require("../utils/sendPaymentSuccessEmail");

const Invoice = require("../models/invoice");
const generateInvoiceNumber = require("../utils/generateInvoiceNumber");
const generateInvoicePdf = require("../utils/generateInvoicePdf");

/* ===============================
   PLAN CONFIG
================================ */
const PLANS = {
  monthly: {
    name: "Monthly",
    amount: 199,
    months: 1,
  },
  "6month": {
    name: "6 Months",
    amount: 999,
    months: 6,
  },
  "12month": {
    name: "12 Months",
    amount: 1799,
    months: 12,
  },
};

/* ===============================
   PRICING PAGE
================================ */
router.get("/pricing", (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  if (req.user.isPremium) {
    return res.redirect("/user/profile");
  }

  res.render("pricing", { user: req.user });
});

/* ===============================
   PAYMENT START
================================ */
router.post("/payment/start", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/user/signin");

    const { plan } = req.body;
    const selectedPlan = PLANS[plan];
    if (!selectedPlan) return res.redirect("/pricing");

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `bfy_${req.user._id.toString().slice(-6)}_${Date.now()}`,
    });

    res.render("checkout", {
      order,
      plan,
      amount: selectedPlan.amount,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      user: req.user,
    });
  } catch (error) {
    console.error("Payment start error:", error);
    res.redirect("/pricing");
  }
});

/* ===============================
   PAYMENT VERIFY (FINAL & SAFE)
================================ */
router.post("/payment/verify", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/user/signin");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      req.body;

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) return res.redirect("/payment/failed");

    /* 🔐 VERIFY SIGNATURE */
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.redirect("/payment/failed");
    }

    /* ✅ PAYMENT SUCCESS */
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + selectedPlan.months);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        isPremium: true,
        premiumSince: now,
        planName: selectedPlan.name,
        planAmount: selectedPlan.amount,
        planExpiryAt: expiry,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
      { new: true }
    );

    /* ===============================
       INVOICE (PDF + DB)
    ============================== */
    const invoiceNumber = await generateInvoiceNumber();

    const { filePath, buffer } = await generateInvoicePdf({
      invoiceNumber,
      name: updatedUser.fullName || "User",
      email: updatedUser.email,
      planName: selectedPlan.name,
      amount: selectedPlan.amount,
      paymentId: razorpay_payment_id,
      invoiceDate: now.toDateString(),
      expiryDate: expiry.toDateString(),
    });

    await Invoice.create({
      userId: updatedUser._id,
      invoiceNumber,
      planName: selectedPlan.name,
      amount: selectedPlan.amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      invoiceDate: now,
      expiryDate: expiry,
      pdfPath: filePath,
    });

    /* ===============================
       EMAIL (PDF ATTACHMENT)
    ============================== */
    try {
      await sendPaymentSuccessEmail({
        email: updatedUser.email,
        name: updatedUser.fullName || "User",
        planName: selectedPlan.name,
        amount: selectedPlan.amount,
        paymentId: razorpay_payment_id,
        expiryDate: expiry.toDateString(),

        invoiceNumber, // ✅ for subject line
        invoiceViewUrl: `${process.env.BASE_URL}/invoices/${invoiceNumber}/download`,
        supportEmail: "kushwahaharsh98@gmail.com",

        attachments: [
          {
            filename: `Invoice-${invoiceNumber}.pdf`,
            content: buffer,
            contentType: "application/pdf",
          },
        ],
      });
    } catch (err) {
  console.error("📧 Payment email failed FULL ERROR:", err);
}

    /* ✅ FINAL REDIRECT */
    return res.redirect("/payment/success");
  } catch (err) {
    console.error("Payment verify error:", err);
    return res.redirect("/payment/failed");
  }
});

/* ===============================
   SUCCESS / FAILED UI
================================ */
router.get("/payment/success", (req, res) => {
  res.render("payment-success", { user: req.user });
});

router.get("/payment/failed", (req, res) => {
  res.render("payment-failed", { user: req.user });
});

module.exports = router;
