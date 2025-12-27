require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const paymentRoute = require("./routes/payment");
const invoiceRoute = require("./routes/invoice");
const subscriptionRoute = require("./routes/subscription");

const { checkAuthenticationCookie } = require("./middleware/authentication");
const { generateToken } = require("./services/authentication");

const Blog = require("./models/blog");

const passport = require("passport");
const session = require("express-session");

require("./auth/google");

const app = express();
const port = process.env.PORT || 3001;

/* -----------------------------
      SESSION (REQUIRED FOR PASSPORT)
----------------------------- */
app.use(
  session({
    secret: "harshSecretKey",
    resave: false,
    saveUninitialized: false,
  })
);

/* -----------------------------
      PASSPORT INITIALIZATION
----------------------------- */
app.use(passport.initialize());
app.use(passport.session());

/* -----------------------------
      DATABASE CONNECTION
----------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* -----------------------------
      GLOBAL MIDDLEWARES
----------------------------- */
app.use(cookieParser());
app.use(express.static(path.resolve("./public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* -----------------------------
      JWT AUTH MIDDLEWARE
----------------------------- */
app.use(checkAuthenticationCookie("token"));

/* -----------------------------
      EJS GLOBAL USER
----------------------------- */
app.use((req, res, next) => {
  console.log("🔥 CURRENT USER:", req.user);
  res.locals.user = req.user || null;
  next();
});

/* -----------------------------
      FLASH MESSAGES
----------------------------- */
app.use((req, res, next) => {
  res.locals.errorMessage = req.cookies.errorMessage || null;
  res.locals.successMessage = req.cookies.successMessage || null;

  res.clearCookie("errorMessage");
  res.clearCookie("successMessage");

  next();
});

/* -----------------------------
      VIEW ENGINE
----------------------------- */
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

/* -----------------------------
      GOOGLE AUTH ROUTES
----------------------------- */
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signin" }),
  (req, res) => {
    // 🔐 Generate JWT for Google user
    const token = generateToken(req.user);

    // 🍪 Set JWT cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.redirect("/");
  }
);
// landing page 
app.get("/", (req, res) => {
  res.render("landing", { user: req.user });
});

/* -----------------------------
      HOME ROUTE
----------------------------- */
app.get("/blogs", async (req, res) => {
  const blogs = await Blog.find({}).sort({ createdAt: -1 });
  res.render("home", {
    user: req.user,
    blogs,
  });
});

/* -----------------------------
      ROUTES
----------------------------- */
app.use("/user", userRoute);
app.use("/blog", blogRoute);
app.use("/", paymentRoute);
app.get("/contact", (req, res) => {
  res.render("contact");
});

app.use("/", invoiceRoute);
app.use("/subscription", subscriptionRoute);

/* -----------------------------
      SERVER START
----------------------------- */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
