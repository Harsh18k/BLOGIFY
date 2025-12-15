const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateInvoicePdf({
  invoiceNumber,
  name,
  email,
  planName,
  amount,
  paymentId,
  invoiceDate,
  expiryDate,
}) {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../invoices");
      if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

      const filePath = path.join(invoicesDir, `${invoiceNumber}.pdf`);

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve({
          filePath,
          buffer: Buffer.concat(buffers),
        });
      });

      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;

      /* ================= HEADER ================= */

      doc.fontSize(26).fillColor("#000").text("Blogify", margin, 50);

      doc
        .fontSize(12)
        .fillColor("#555")
        .text("Premium Subscription Invoice", margin, 82);

      doc
        .fontSize(22)
        .fillColor("#000")
        .text("INVOICE", margin, 50, {
          width: pageWidth - margin * 2,
          align: "right",
        });

      doc
        .fontSize(11)
        .fillColor("#555")
        .text(`Invoice No: ${invoiceNumber}`, margin, 82, {
          width: pageWidth - margin * 2,
          align: "right",
        })
        .text(`Invoice Date: ${invoiceDate}`, {
          width: pageWidth - margin * 2,
          align: "right",
        });

      doc
        .moveTo(margin, 125)
        .lineTo(pageWidth - margin, 125)
        .strokeColor("#ddd")
        .stroke();

      /* ================= WATERMARK ================= */

      doc.save();

      doc
        .rotate(-45, {
          origin: [pageWidth / 2, pageHeight / 2],
        })
        .fontSize(80)
        .fillColor("#e6e6e6")
        .opacity(0.15)
        .text(
          "BLOGIFY",
          pageWidth / 2 - 300,
          pageHeight / 2,
          {
            width: 600,
            align: "center",
          }
        );

      doc.restore();

      /* ================= BILL TO ================= */

      let y = 145;

      doc.fontSize(11).fillColor("#000").text("BILL TO:", margin, y);
      y += 20;

      doc.fontSize(11).fillColor("#555").text(name, margin, y);
      y += 16;

      doc.text(email, margin, y);
      y += 40;

      /* ================= TABLE HEADER ================= */

      doc.fontSize(11).fillColor("#000");
      doc.text("ITEM", margin, y);
      doc.text("PRICE", 300, y);
      doc.text("QTY", 380, y);
      doc.text("TOTAL", 460, y);

      y += 15;

      doc
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .strokeColor("#ddd")
        .stroke();

      y += 20;

      /* ================= TABLE ROW ================= */

      doc.fontSize(11).fillColor("#555");
      doc.text(planName, margin, y, { width: 220 });
      doc.text(`₹${amount}`, 300, y);
      doc.text("1", 380, y);
      doc.text(`₹${amount}`, 460, y);

      y += 50;

      /* ================= PAYMENT INFO ================= */

      doc.fontSize(10).fillColor("#555");
      doc.text(`Payment ID: ${paymentId}`, margin, y);
      y += 16;
      doc.text(`Valid Till: ${expiryDate}`, margin, y);

      /* ================= TOTAL BOX (NO OVERFLOW) ================= */

      const boxX = pageWidth - margin - 200;
      const boxY = y - 30;
      const boxWidth = 200;
      const boxHeight = 90;
      const padding = 15;

      doc.rect(boxX, boxY, boxWidth, boxHeight).fill("#f6f6f6");

      doc.fillColor("#000").fontSize(11);

      // Subtotal
      doc.text("Subtotal", boxX + padding, boxY + 15);
      doc.text(
        `₹${amount}`,
        boxX + padding,
        boxY + 15,
        {
          width: boxWidth - padding * 2,
          align: "right",
        }
      );

      // Tax
      doc.text("Tax", boxX + padding, boxY + 35);
      doc.text(
        "₹0",
        boxX + padding,
        boxY + 35,
        {
          width: boxWidth - padding * 2,
          align: "right",
        }
      );

      // Divider
      doc
        .moveTo(boxX + padding, boxY + 55)
        .lineTo(boxX + boxWidth - padding, boxY + 55)
        .strokeColor("#ccc")
        .stroke();

      // Total
      doc.fontSize(12);
      doc.text("Total", boxX + padding, boxY + 65);
      doc.text(
        `₹${amount}`,
        boxX + padding,
        boxY + 65,
        {
          width: boxWidth - padding * 2,
          align: "right",
        }
      );

      /* ================= FOOTER ================= */

      const footerY = pageHeight - margin - 20;

      doc
        .fontSize(9)
        .fillColor("#888")
        .text(
          "This is a system generated invoice. No signature required.",
          margin,
          footerY,
          {
            width: pageWidth - margin * 2,
            align: "center",
          }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateInvoicePdf;