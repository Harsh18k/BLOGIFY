// const mongoose = require('mongoose');
// const { Schema, model } = mongoose;
// const blogSchema = new Schema({
//     title: { type: String, required: true },
//     body: { type: String, required: true },
//     coverImageURL: { type: String, default: "/image/blog_default.jpg" },
//     CREATED_BY: { type: Schema.Types.ObjectId, ref: 'User', required: true },
// },{ timestamps: true });
// module.exports = model('Blog', blogSchema);


const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    //  Editor.js content
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },

    coverImageURL: {
      type: String,
      default: "/image/blog_default.jpg",
    },

    CREATED_BY: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Blog", blogSchema);