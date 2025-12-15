const { verifyToken } = require("../services/authentication");
const User = require("../models/user");

function checkAuthenticationCookie(cookieName) {
  return async (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];

    if (!tokenCookieValue) {
      req.user = null;
      return next();
    }

    try {
      // 1️⃣ verify token
      const userPayload = verifyToken(tokenCookieValue);

      // 2️⃣ attach payload FIRST (very important)
      req.user = userPayload;

      // 3️⃣ optionally get fresh user (non-blocking logic)
      const freshUser = await User.findById(userPayload._id);
      if (freshUser) {
        req.user = freshUser;
      }

    } catch (err) {
      req.user = null;
    }

    next();
  };
}

module.exports = { checkAuthenticationCookie };