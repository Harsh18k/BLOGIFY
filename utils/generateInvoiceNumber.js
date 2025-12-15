const crypto = require("crypto");

function generateInvoiceNumber() {
  const year = new Date().getFullYear();

  // 3 bytes = 6 hex chars (enough randomness)
  const randomPart = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `INV-BFY-${year}-${randomPart}`;
}

module.exports = generateInvoiceNumber;