const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const email = profile.emails?.[0]?.value;
        const googleImage = profile.photos?.[0]?.value;

        // 🔍 find by email first (important)
        let user = await User.findOne({ email });

        if (!user) {
          // 🆕 first time Google user
          user = await User.create({
            googleId: profile.id,
            fullName: profile.displayName,
            email,
            profileImageURL: googleImage, // ✅ real google image
            isPremium: false,
            role: "USER",
          });
        } else {
          // 🔁 existing user → attach googleId if missing
          if (!user.googleId) {
            user.googleId = profile.id;
          }

          // 🔁 update google image if changed
          if (googleImage && user.profileImageURL !== googleImage) {
            user.profileImageURL = googleImage;
          }

          await user.save();
        }

        return cb(null, user);
      } catch (err) {
        return cb(err, null);
      }
    }
  )
);

// passport session helpers (unchanged)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});