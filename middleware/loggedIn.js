function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    console.log(req.data)
    if (req.isAuthenticated()) return next();
    // if they aren't redirect them to the home page
    res.redirect("/login");
  }

  module.exports = isLoggedIn;
