const { Schema, model } = require("mongoose");

const invoiceSchema = new Schema(
  {
    //  User reference
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Invoice identity
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    //  Payment details
    planName: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentId: {
      type: String,
      required: true,
    },

    orderId: {
      type: String,
      required: true,
    },

    // 📅Dates
    invoiceDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    //  PDF storage
    pdfPath: {
      type: String,
      required: true,
    },

    // Status 
    status: {
      type: String,
      enum: ["PAID", "REFUNDED"],
      default: "PAID",
    },
  },
  { timestamps: true }
);

module.exports = model("Invoice", invoiceSchema);