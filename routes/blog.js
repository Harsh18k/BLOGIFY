const { Router } = require("express");

const upload = require("../config/multer");

const Blog = require("../models/blog");
const Comment = require("../models/comment");
const user = require("../models/user");

const router = Router();



/* ===============================
   ADD NEW BLOG PAGE
================================ */
router.get("/add-new", (req, res) => {
  return res.render("addBlog", { user: req.user });
});


// editor.js ka image upload route
router.post(
    "/upload-image",
    upload.single("image"),
    (req, res) => {
      return res.json({
        success: 1,
        file: {
          url: req.file.path,
        },
      });
    }
  );

  // =================================
  // PREVIEW Route
  // =================================
  router.get("/preview", (req,res)=>{
    return res.render("blogPreview", {
      user :req.user,
    });
  });

/* ===============================
   SINGLE BLOG PAGE
================================ */
router.get("/:blogId", async (req, res) => {
  const { blogId } = req.params;

  const blog = await Blog.findById(blogId).populate("CREATED_BY");

  const comments = await Comment.find({ BLOG_ID: blogId })
    .populate("CREATED_BY")
    .sort({ createdAt: -1 });

  return res.render("blog", {
    blog,
    user: req.user,
    comments,
  });
});

/* ===============================
   ADD COMMENT
================================ */
router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    BLOG_ID: req.params.blogId,
    CREATED_BY: req.user._id,
  });

  return res.redirect(`/blog/${req.params.blogId}`);
});

/* ===============================
   CREATE BLOG (EDITOR.JS READY)
================================ */
router.post("/", upload.single("coverImage"), async (req, res) => {
    try {
      const { title, content } = req.body;
  
      if (!content) {
        return res.status(400).send("Blog content is required");
      }
  
      const blog = await Blog.create({
        title,
        content: JSON.parse(content), // 🔥 IMPORTANT
        CREATED_BY: req.user._id,
        coverImageURL: req.file
          ? req.file.path 
          : "/image/blog_default.jpg",
      });
  
      return res.redirect(`/blog/${blog._id}`);
    } catch (err) {
      console.error("Blog create error:", err);
      return res.status(500).send("Something went wrong");
    }
  });

module.exports = router;
