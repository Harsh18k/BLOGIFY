module.exports = function rightPanelLocals(req, res, next) {
    res.locals.suggestedBlog = null;
    res.locals.recentReads = [];
    next();
  };