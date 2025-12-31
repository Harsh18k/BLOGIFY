const { getEditorPick } = require("../services/editorPick.service");
const Blog = require("../models/blog");

async function attachRightPanelData(req, res, next) {
  try {
    /* =========================
       1️⃣ EDITOR PICK 
    ========================== */
    const editorPick = await getEditorPick();

    if (editorPick && editorPick._id) {
      res.locals.suggestedBlog = editorPick;
    }

    /* =========================
       2️⃣ RECENT READS 
    ========================== */

    // Always keep EJS safe
    res.locals.recentReads = [];

    // Guest user → nothing to do
    if (!req.user || !Array.isArray(req.user.recentReads) || req.user.recentReads.length === 0) {
      return next();
    }

    // Fetch blogs user has read
    const blogs = await Blog.find({
      _id: { $in: req.user.recentReads },
      status: "PUBLISHED",
    })
      .populate("CREATED_BY")
      .select("title content coverImageURL createdAt CREATED_BY")
      .lean();

    // Preserve order (latest read first)
    const orderedReads = req.user.recentReads
      .map(id => blogs.find(b => b._id.toString() === id.toString()))
      .filter(Boolean);

    res.locals.recentReads = orderedReads;

    next();
  } catch (err) {
    console.error("Right Panel Middleware Error:", err);

    // NEVER crash UI
    res.locals.recentReads = res.locals.recentReads || [];
    next();
  }
}

module.exports = attachRightPanelData;