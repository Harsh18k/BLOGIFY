const Blog = require("../models/blog");

module.exports = async function addDraftCount(req, res, next) {
  try {
    if (!req.user) {
      res.locals.draftCount = 0;
      return next();
    }

    const count = await Blog.countDocuments({
      CREATED_BY: req.user._id,
      status: "DRAFT"
    });

    res.locals.draftCount = count;
    next();
  } catch (err) {
    console.error("Draft count error:", err);
    res.locals.draftCount = 0;
    next();
  }
};