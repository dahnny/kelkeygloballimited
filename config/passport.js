// config/passport.js

// load all the things we need
var LocalStrategy = require("passport-local").Strategy;

// load up the user model
var Admin = require("../models/Admin");
var SignupUser = require("../models/user");
const referralCodes = require("referral-codes")

// expose this function to our app using module.exports
module.exports = function (passport) {
  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    SignupUser.findById(id, function (err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use(
    "local-register",
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true, // allows us to pass back the entire request to the callback
      },
      async (req, email, password, done) => {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(async () => {
          const { first_name, last_name, confirm_password, phone_number, referralCode } =
            req.body;

          // find a user whose email is the same as the forms email

          if (!first_name || !last_name || !phone_number || !confirm_password) {
            return done(
              null,
              false,
              req.flash("signupMessage", "Please enter all fields")
            );
          }

          if (password !== confirm_password) {
            return done(
              null,
              false,
              req.flash("signupMessage", "Passwords do not match")
            );
          }

          // we are checking to see if the user trying to login already exists

          const user_exists = await SignupUser.findOne({ email: email });
          if (user_exists) {
            console.log("user alread exists!!!!!!!!");
            return done(
              null,
              false,
              req.flash("signupMessage", "email already taken")
            );
          }

          var newUser = new SignupUser();
          // // set the user's local credentials
          // newUser.local.username = username
          newUser.email = email;
          newUser.password = newUser.generateHash(password);
          newUser.first_name = req.body.first_name;
          newUser.last_name = req.body.last_name;
          newUser.phone_number = req.body.phone_number;
          newUser.referralCode =   referralCodes.generate({
            length: 6,
            charset: "0123456789",
          })[0]
          const new_saved = await newUser.save();
          /** referral */

          if (referralCode) { 
            await SignupUser.findOneAndUpdate(
              { referralCode },
              {
                $push: {
                  referrals: new_saved._id,
                },
              }
            );
          }

          return done(null, newUser);
        });
      }
    )
  );

  passport.use(
    "local-login",
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true, // allows us to pass back the entire request to the callback
      },
      function (req, email, password, done) {
        // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        SignupUser.findOne({ email: email }, function (err, user) {
          // if there are any errors, return the error before anything else
          if (err) return done(err);

          // if no user is found, return the message
          if (!user)
            return done(
              null,
              false,
              req.flash("loginMessage", "No user found.")
            ); // req.flash is the way to set flashdata using connect-flash

          // if the user is found but the password is wrong
          if (!user.validPassword(password))
            return done(
              null,
              false,
              req.flash("loginMessage", "Oops! Wrong password.")
            ); // create the loginMessage and save it to session as flashdata

          // all is well, return successful user

          return done(null, user);
        });
      }
    )
  );
};
