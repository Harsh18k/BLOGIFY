const express = require("express");
const router = express.Router();
const Invoice = require("../models/invoice");
const mongoose = require("mongoose");

function requireAuth(req, res, next) {
  if (!req.user) return res.redirect("/user/signin");
  next();
}

/* ===============================
   PURCHASE HISTORY PAGE
================================ */

router.get("/invoices/history", requireAuth, async (req, res) => {

    const invoices = await Invoice.find({ userId: req.user._id });
  
    res.render("invoice-history", {
      user: req.user,
      invoices,
    });
  });



/* ===============================
   DOWNLOAD INVOICE
================================ */
router.get("/invoices/:id/download", requireAuth, async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!invoice) {
    return res.status(404).send("Invoice not found");
  }

  res.download(invoice.pdfPath);
});


// Download latest invoice
router.get("/invoices/latest", requireAuth, async (req, res) => {
    try {
      const invoice = await Invoice.findOne({
        userId: req.user._id,
      }).sort({ invoiceDate: -1 }); //  latest invoice
  
      if (!invoice) {
        return res.status(404).send("No invoice found");
      }
  
      return res.download(invoice.pdfPath);
  
    } catch (err) {
      console.error("Invoice download error:", err);
      return res.status(500).send("Failed to download invoice");
    }
  });

module.exports = router;
