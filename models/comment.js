const {Schema, model} = require("mongoose");
const commentSchema = new Schema({
    content: { type: String, required: true },
    BLOG_ID: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
    CREATED_BY: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
module.exports = model("Comment", commentSchema);
