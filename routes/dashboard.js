const { Router } = require("express");
const Blog = require("../models/blog");
const router = Router();


// DRAFT DASHBOARD

router.get("/drafts", async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect("/user/signin");
      }
  
      const drafts = await Blog.find({
        CREATED_BY: req.user._id,
        status: "DRAFT",
      }).sort({ updatedAt: -1 });
  
      return res.render("dashboard/drafts", {
        user: req.user,
        drafts,
      });
    } catch (err) {
      console.error("Draft dashboard error:", err);
      return res.status(500).send("Something went wrong");
    }
  });
  
  module.exports = router;