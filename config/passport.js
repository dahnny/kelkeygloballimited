// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var Admin            = require("../models/Admin");
var User            = require("../models/user");


// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });



    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-register', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    async(req,email, password, done) =>{

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(async() => {

            const { first_name, last_name, confirm_password }

        // find a user whose email is the same as the forms email

        if(!first_name || !last_name | !confirm_password){
            return done(null, false, req.flash('signupMessage', 'Please enter all fields'));
        }

        if(password !== confirm_password){
            return done(null, false, req.flash('signupMessage', 'Passwords do not match'));
        }

        // we are checking to see if the user trying to login already exists
    
        const user_exists = await User.findOne({ 'email' :  email })
        if(user_exists){
            console.log("user alread exists!!!!!!!!")
            return done(null, false, req.flash('signupMessage', 'email already taken'));
        } 


        var newUser    = new User();
        // // set the user's local credentials
        // newUser.local.username = username.toLowerCase()
        newUser.email    = email.toLowerCase();
        newUser.password = newUser.generateHash(password);
      
        newUser.first_name = req.body.first_name.toLowerCase()
        newUser.last_name = req.body.last_name.toLowerCase()
        await newUser.save()
   
            return done(null, newUser);
      
        }
        );

    }));



    // passport.use('admin-signup', new LocalStrategy({
    //     // by default, local strategy uses username and password, we will override with email
    //     usernameField : 'email',
    //     passwordField : 'password',
    //     passReqToCallback : true // allows us to pass back the entire request to the callback
    // },
    // async(req,email, password, done) =>{

    //     // asynchronous
    //     // Admin.findOne wont fire unless data is sent back
    //     process.nextTick(async() => {


            
    //     // find a user whose email is the same as the forms email
    //     // we are checking to see if the user trying to login already exists

    //     try {
                   
    //     const user_exists = await Admin.findOne({ 'email' :  email })

    //     console.log({user_exists})
    //     if(user_exists){
    //         return done(null, false, req.flash('signupMessage', 'email already taken'));
    //     } 
    //     var newAdmin    = new Admin();
    //     // // set the user's local credentials
    //     // newAdmin.local.username = username.toLowerCase()
    //     newAdmin.email    = email.toLowerCase();
    //     newAdmin.password = newAdmin.generateHash(password);
    //     newAdmin.firstname = req.body.firstname.toLowerCase()
    //     newAdmin.lastname = req.body.lastname.toLowerCase()
    //     await newAdmin.save()
    //             /** referral */
   
    //         return done(null, newAdmin);
        

    //     } catch (error) {
    //         console.warn({error})
    //     }

    //     }
    //     );

    // }));


    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email.toLowerCase() }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user

           
            return done(null, user);
        });

    }));


    
};