const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const path = require("path");

/* ===============================
   MULTER CONFIG
================================ */

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogify",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

module.exports = upload;
