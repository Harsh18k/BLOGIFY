const { Router } = require("express");

const upload = require("../config/multer");

const Blog = require("../models/blog");
const Comment = require("../models/comment");
const user = require("../models/user");
const { route } = require("./user");

const router = Router();



/* ===============================
   ADD NEW BLOG PAGE
================================ */
router.get("/add-new", (req, res) => {
  return res.render("addBlog", { user: req.user,draft: null });
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

  // draft route ====================================================================

  router.post("/draft", upload.single("coverImage"), async (req, res) => {
    try {
      //  AUTH GUARD
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
  
      //  PREMIUM GUARD
      if (!req.user.isPremium) {
        return res.status(403).json({
          message: "Premium subscription required to save drafts",
        });
      }
  
      const { title, content, draftId } = req.body;
  
      if (!content) {
        return res.status(400).json({ message: "Draft content required" });
      }
  
      const parsedContent = JSON.parse(content);
      let blog;
  
      if (draftId) {
        // ---------- UPDATE DRAFT ----------
        const updateData = {
          title: title || "Untitled Draft",
          content: parsedContent,
          updatedAt: new Date(),
        };
  
        if (req.file) {
          updateData.coverImageURL =
            req.file.path || req.file.secure_url;
        }
  
        blog = await Blog.findOneAndUpdate(
          { _id: draftId,
             CREATED_BY: req.user._id,
             status: "DRAFT",
             },
          updateData,
          { new: true }
        );
        // safety fallback
      if (!blog) {
        return res.status(404).json({ message: "Draft not found" });
      }
      }
  
      // 🆕 CREATE IF NOT FOUND
      if (!blog) {
        blog = await Blog.create({
          title: title || "Untitled Draft",
          content: parsedContent,
          CREATED_BY: req.user._id,
          status: "DRAFT",
          coverImageURL: req.file
            ? req.file.path || req.file.secure_url
            : "/image/blog_default.jpg",
        });
      }
  
      return res.json({
        success: true,
        draftId: blog._id,
      });
  
    } catch (err) {
      console.error("Auto-save draft failed", err);
      return res.status(500).json({ message: "Draft save failed" });
    }
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
    const { title, content, draftId } = req.body;
    const parsedContent = JSON.parse(content);

    let blog;

    if (draftId) {
      // ✅ PUBLISH EXISTING DRAFT (NO NEW ENTRY)
      const updateData = {
        title,
        content: parsedContent,
        status: "PUBLISHED",
        publishedAt: new Date(),
      };

      if (req.file) {
        updateData.coverImageURL =
          req.file.path || req.file.secure_url;
      }

      blog = await Blog.findOneAndUpdate(
        {
          _id: draftId,
          CREATED_BY: req.user._id,
        },
        updateData,
        { new: true }
      );

      if (!blog) {
        return res.status(404).send("Draft not found");
      }

    } else {
      // 🆕 NORMAL PUBLISH (NO DRAFT)
      blog = await Blog.create({
        title,
        content: parsedContent,
        CREATED_BY: req.user._id,
        status: "PUBLISHED",
        publishedAt: new Date(),
        coverImageURL: req.file
          ? req.file.path || req.file.secure_url
          : "/image/blog_default.jpg",
      });
    }

    return res.redirect(`/blog/${blog._id}`);

  } catch (err) {
    console.error("Blog publish error:", err);
    return res.status(500).send("Something went wrong");
  }
});

// ==================================================
// edit draft route
// =====================================================
router.get("/edit/:id", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/user/signin");

    const draft = await Blog.findOne({
      _id: req.params.id,
      CREATED_BY: req.user._id,
      status: "DRAFT",
    });

    if (!draft) {
      return res.redirect("/dashboard/drafts");
    }

    return res.render("addBlog", {
      user: req.user,
      draft, // 👈 VERY IMPORTANT
    });

  } catch (err) {
    console.error("Edit draft error:", err);
    return res.redirect("/dashboard/drafts");
  }
});

// ======================
// publish from draft page 
// ======================
// ===============================
// PUBLISH DRAFT FROM DASHBOARD
// ===============================
router.get("/publish/:id", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/user/signin");

    const { id } = req.params;

    const blog = await Blog.findOneAndUpdate(
      {
        _id: id,
        CREATED_BY: req.user._id,
        status: "DRAFT",
      },
      {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).render("error", {
        message: "Draft not found or already published",
      });
    }

    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error("Publish draft error:", err);
    return res.status(500).send("Failed to publish draft");
  }
});
// ===============================
// SOFT DELETE BLOG (DRAFT + PUBLISHED)
// ===============================
router.post("/delete/:id", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/user/signin");

    const { id } = req.params;

    const blog = await Blog.findOneAndUpdate(
      {
        _id: id,
        CREATED_BY: req.user._id,
        status: { $ne: "DELETED" }, // already deleted nahi hona chahiye
      },
      {
        status: "DELETED",
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // redirect logic
    return res.redirect(req.get("Referer") || "/");

  } catch (err) {
    console.error("Soft delete error:", err);
    return res.status(500).send("Delete failed");
  }
});
// ===============================
// RESTORE SOFT-DELETED BLOG
// ===============================
router.post("/restore/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/user/signin");
    }

    const { id } = req.params;

    const blog = await Blog.findOneAndUpdate(
      {
        _id: id,
        CREATED_BY: req.user._id,
        status: "DELETED",
      },
      {
        status: "DRAFT", // restore as draft (safe default)
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).send("Blog not found or already restored");
    }

    return res.redirect(req.get("referer") || "/user/my-blogs");

  } catch (err) {
    console.error("Restore blog error:", err);
    return res.status(500).send("Failed to restore blog");
  }
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

module.exports = router;
