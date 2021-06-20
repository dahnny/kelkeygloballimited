function admin(req, res, next) {
    // if user is authenticated in the session, carry on
    
    if (req.user.is_admin) return next();
    // if they aren't redirect them to the home page
    console.log("you arent an admin bastad")
    res.redirect("/dashboard")
  }

  module.exports = admin;
