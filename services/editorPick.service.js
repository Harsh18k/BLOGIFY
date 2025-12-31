const Blog = require("../models/blog");

async function getEditorPick() {
  try {
    const blog = await Blog.findOne({ isEditorPick: true })
      .select("title coverImageURL createdAt")
      .lean();

    return blog || null;
  } catch (error) {
    console.error("Editor Pick Fetch Error:", error);
    return null;
  }
}

module.exports = {
  getEditorPick
};