const express = require("express");
const request = require("request");

var FroalaEditor = require("wysiwyg-editor-node-sdk/lib/froalaEditor.js");
const router = express.Router();

const moment = require("moment");
var csrf = require("csurf");
var csrfProtection = csrf({ cookie: true });

const isLoggedIn = require("../middleware/loggedIn");
const id_admin = require("../middleware/is_admin");
let passport;

passport = require("passport");
require("../config/passport")(passport);
const multer = require("multer");
// var upload = multer({ dest: 'uploads/' })
var cloudinary = require("cloudinary").v2;
const referralCodes = require("referral-codes")
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Category = require("../models/Category");
const Properties = require("../models/Properties");
const SignupUser = require("../models/user");


// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  // cloud_name: process.env.CLOUD_NAME,
  // api_key: process.env.API_KEY,
  // api_secret: process.env.API_SECRET
});

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const upload = multer({ storage });

router.get("/login", csrfProtection, async (req, res) => {
  // console.log("Referral ID",req.query['referral'])
  // render the page and pass in any flash data if it exists
  return res.render("admin/Login", {
    message: req.flash("loginMessage"),
    successMessage: req.flash("successMessage"),
    title: "Log-In",
    csrfToken: req.csrfToken(),
  });
});

router.post(
  "/login",
  csrfProtection,
  passport.authenticate("local-login", {
    // successRedirect: "/dashboard", // redirect to the secure profile section
    failureRedirect: "/login", // redirect back to the signup page if there is an error
    failureFlash: true, // allow flash messages
  }),
  function (req, res) {
    res.redirect("/dashboard");
  }
);

router.get("/register", csrfProtection, async (req, res) => {
  try {
     // console.log("Referral ID",req.query['referral'])
  // render the page and pass in any flash data if it exists
  return res.render("admin/Register", {
    signupMessage: req.flash("signupMessage"),
    successMessage: req.flash("successMessage"),
    title: "Log-In",
    csrfToken: req.csrfToken(),
  });
  } catch (error) {
    console.log({error})
    return res.render("admin/Forbidden")
  }

 
});

router.post(
  "/register",
  csrfProtection,
  passport.authenticate("local-register", {
    // successRedirect: "/dashboard", // redirect to the secure profile section
    failureRedirect: "/register", // redirect back to the signup page if there is an error
    failureFlash: true, // allow flash messages
  }),
  function (req, res) {
    res.redirect("/dashboard");
  }
);

router.get("/dashboard", isLoggedIn, async (req, res) => {
try {

  const user  = await SignupUser.findById(req.user.id).populate("referrals")
 
  console.log({user})
  if(user.is_admin){
    var property_length = await (await Properties.find()).length;
    var all_properties = await Properties.find();
  
    var valuation = await all_properties.reduce((n, { price }) => n + price, 0);
    console.log({ valuation });
  
    var user_length = await (await SignupUser.find()).length;
  
    var popular_properties = await (
      await Properties.find()
        .where("status")
        .equals("published")
        .populate("category")
        .sort({
          views: -1,
        })
    ).slice(0, 4);
    // console.log({views })
    return res.render("admin/Dashboard", {
      property_length,
      user_length,
      valuation,
      popular_properties,
      user,
      moment
    });
  }else {
  
    // console.log({views })
    res.render("admin/Dashboard", {
   user,
   
   moment
    });
  }
 

} catch (error) {
  console.log({error})
  return res.render("admin/Forbidden")
}
});

router.get("/dashboard/add-property", isLoggedIn, id_admin, async (req, res) => {
  try {
    const user  = await SignupUser.findById(req.user.id).populate("referrals")
    var categories = await Category.find();
    console.log({ categories });

    res.render("admin/AddProperty", {
      categories,
      message: req.flash("error"),
      successMessage: req.flash("success"),
      user
      // post_length,
      // views,
      // published
    });
  } catch (error) {
    console.log({ error });
    req.flash("error", "Something went wrong");
    return res.redirect("/dashboard/add-property");
  }
});

router.post(
  "/dashboard/add-property",
  isLoggedIn,
  id_admin,
  upload.array("properties", 5),
  async (req, res) => {
    try {
      
      const {
        title,
        location,
        category,
        content,
        amenities,
        video,
        price,
        bedrooms,
        bathrooms,
        sqft_size,
      } = req.body;

      console.log({
        title,
        location,
        category,
        content,
        amenities,
        video,
        price,
        bedrooms,
        bathrooms,
        sqft_size,
      });

      let pictureFiles = req.files;
      //Check if files exist
      if (!pictureFiles) {
        req.flash(
          "error",
          "Property images are missing, please upload all required images"
        );
        return res.redirect("/dashboard/add-property");
      }

      //map through images and create a promise array using cloudinary upload function
      let multiplePicturePromise = pictureFiles.map((picture) =>
        cloudinary.uploader.upload(picture.path)
      );
      // await all the cloudinary upload functions in promise.all, exactly where the magic happens
      let imageResponses = await Promise.all(multiplePicturePromise);
      // res.status(200).json({ images: imageResponses });
      console.log({ imageResponses });

      if (
        !title ||
        !location ||
        !category ||
        !content ||
        !price ||
        !bedrooms ||
        !bathrooms ||
        !sqft_size
      ) {
        req.flash("error", "Some fields are missing. Please enter all fields");
        return res.redirect("/dashboard/add-property");
      }

      const new_property = new Properties({
        title,
        location,
        category,
        owner: req.user.id,
        content,
        price,
        amenities,
        image_one: imageResponses[0].url,
        image_one_name: imageResponses[0].public_id,

        image_two: imageResponses[1].url,
        image_two_name: imageResponses[1].public_id,

        image_two: imageResponses[2].url,
        image_two_name: imageResponses[2].public_id,

        image_three: imageResponses[3].url,
        image_three_name: imageResponses[3].public_id,

        details: {
          bedrooms,
          bathrooms,
          sqft_size,
        },
      });

      await new_property.save();
      // var post_length = await (await Post.find()).length
      // var posts = await Post.find()

      // var views =await posts.reduce((n, {views}) => n + views, 0)

      // var published = await (await Post.find({status : "published"})).length

      // console.log({views })
      req.flash("success", "Property has been added successfully!!");
      return res.redirect("/dashboard/add-property");
    } catch (error) {
      console.log({ error });
      req.flash("error", "Something went wrong");
      return res.redirect("/dashboard/add-property");
    }
  }
);

router.get("/dashboard/properties", isLoggedIn,id_admin, async (req, res) => {
  // var post_length = await (await Post.find()).length
  // var posts = await Post.find()

  // var views =await posts.reduce((n, {views}) => n + views, 0)

  // var published = await (await Post.find({status : "published"})).length

  // console.log({views })
  const user  = await SignupUser.findById(req.user.id).populate("referrals")
  var all_properties = await Properties.find();
  res.render("admin/Properties", {
    all_properties,
    message: req.flash("error"),
    successMessage: req.flash("success"),
    moment,
    user
    // post_length,
    // views,
    // published
  });
});

router.get(
  "/dashboard/properties/:id/publish",
  isLoggedIn,
  id_admin,
  async (req, res) => {
    const { id } = req.params;
    if (!id) {
      req.flash("error", "Something went wrong");
      return res.redirect("/dashboard/properties");
    }

    
    await Properties.findByIdAndUpdate(id, {
      $set: {
        status: "published",
      },
    });

    req.flash("success", "Property has been published successfully");
    return res.redirect("/dashboard/properties");
  }
);
router.get(
  "/dashboard/properties/:id/unpublish",
  isLoggedIn,
  id_admin,
  async (req, res) => {
    const { id } = req.params;
    if (!id) {
      req.flash("error", "Something went wrong");
      return res.redirect("/dashboard/properties");
    }

    await Properties.findByIdAndUpdate(id, {
      $set: {
        status: "draft",
      },
    });

    req.flash("success", "Property has been converted to draft successfully");
    return res.redirect("/dashboard/properties");
  }
);


router.get("/dashboard/properties/:slug", isLoggedIn,id_admin, async (req, res) => {
  const {slug} = req.params
  var property = await Properties.findOne({ slug }).populate("category");
  const user  = await SignupUser.findById(req.user.id).populate("referrals")
  res.render("admin/Property", {
    property,
    moment,
    user
  });
});

router.get("/dashboard/users", isLoggedIn,id_admin, async (req, res) => {
const  users = await SignupUser.find()
const user  = await SignupUser.findById(req.user.id).populate("referrals")
  // var posts = await Post.find()

  // var views =await posts.reduce((n, {views}) => n + views, 0)

  // var published = await (await Post.find({status : "published"})).length

  // console.log({views })
  res.render("admin/Users", {
    users,
    moment,
    message: req.flash("error"),
    successMessage: req.flash("success"),
    user

    // post_length,
    // views,
    // published
  });
});
router.post("/dashboard/create-category", isLoggedIn,id_admin, async (req, res) => {
  var { category_name } = req.body;

  if (!category_name) {
    req.flash("error", "Please enter a proper category name");
    return res.redirect("/dashboard/create-category");
  }

  var exists = await Category.findOne({ category_name });

  // Post

  if (exists) {
    req.flash("error", "This category already exists");
    return res.redirect("/dashboard/create-category");
  } else {
    var new_category = await new Category({
      category_name,
    });
    await new_category.save();
    req.flash("success", "Category created successfully");
    res.redirect("/dashboard/create-category");
    // res.json(new_category)
  }
});

router.get("/", async (req, res) => {
  const properties = await Properties.find({status : "published"})
  const authenticated = req.isAuthenticated()
  console.log({authenticated})
  res.render("index",{
    properties,
    authenticated
  });
});
router.get("/about", async (req, res) => {
  const authenticated = req.isAuthenticated()
  res.render("about", {
    authenticated
  });
});

router.get("/contact", async (req, res) => {
  const authenticated = req.isAuthenticated()
  res.render("contact",{
    authenticated
  });
});

  // =====================================
  // PASWORD RESET  ========
  // =====================================
  router.get("/reset-password", csrfProtection, function (req, res) {
    res.render("admin/forgotPassword", {
      message: req.flash("error"),
      successMessage: req.flash("success"),
      csrfToken: req.csrfToken(),
    }); // load the index.ejs file
  });

  router.post("/reset-password", async (req, res, next) => {
    const token = (await promisify(crypto.randomBytes)(20)).toString("hex");
    // const user = User.find(u => u.email === req.body.email);
    // console.log(req.body.email)
    // console.log(token)
    console.log("email ", req.body.email);
    SignupUser.findOne({ email: req.body.email.toLowerCase() })
      .then((user) => {
        console.log({ user });
        if (!user) {
          req.flash("error", "No account with that email address exists.");
          return res.redirect("/reset-password");
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;

        user.save()

        const resetEmail = {
          to: req.body.email,
          from: '"Kelkeyglobal" <info@kelkeyglobal.com>',
          subject: "Password Reset",
          text: `
                      You are receiving this because you (or someone else) have requested the reset of the password for your account.
                      Please click on the following link, or paste this into your browser to complete the process:
                      http://${req.headers.host}/reset/${token}
                      If you did not request this, please ignore this email and your password will remain unchanged.
                    `,
        };
        // mailgun.messages().send(resetEmail, function (error, body) {
        //   if (error) {
        //     console.log(error);
        //   }
        //   console.log("EMAIL SENT!!!");
        //   req.flash(
        //     "info",
        //     `An e-mail has been sent to ${req.body.email} with further instructions.`
        //   );
        //   res.redirect("/reset-password");
        // });
        transporter.sendMail(resetEmail, function (err, info) {
          if (err) {
            console.log(err);

            req.flash(
              "error",
              `Something went wrong. Please refresh and try again.`
            );
            return res.redirect("/reset-password");
          } else {
            req.flash(
              "success",
              `An e-mail has been sent to ${req.body.email} with further instructions.`
            );
            return res.redirect("/reset-password"); // return ('Email sent')
          }
        });
      })
      .catch((err) => {
        return res.json(err.message);
      });
    // =====================================
    // PASWORD RESET  ========
    // =====================================
  });

  router.get("/reset/:token", csrfProtection, function (req, res) {

  
    res.render("user/new_password.ejs", {
      message: req.flash("error"),
      successMessage: req.flash("success"),
      csrfToken: req.csrfToken(),
    }); // load the index.ejs file
  });

  router.post("/reset/:token", csrfProtection, function (req, res) {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    if (!password || !confirm_password) {
      req.flash("error", "Please enter all fields");
      return res.redirect(`/reset/${token}`);
    }
    if (password !== confirm_password) {
      req.flash("error", "Passwords do not match");
      return res.redirect(`/reset/${token}`);
    }
    User.findOne({
      resetPasswordToken: token,
    }).then((data) => {
      console.log("user found via token ", data)
      if (data) {
        if (Date.now() > data.resetPasswordExpires) {
          req.flash("error", "This session has expired");
          return res.redirect(`/reset-password`);
        }
        const new_password = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);;

        User.findOneAndUpdate(
          { resetPasswordToken: token },
          {
            $set: {
              password: new_password,
            },
          }
        ).then((update)=>{
          req.flash("successMessage", "password has been updated successfully. Please Login")
          return res.redirect("/login")
        });
      }else{
        req.flash("loginMessage","session is invalid.")
        return res.redirect("/login")
      }
    }).catch((err)=>{
      console.log({err})

      req.flash("error","Something went wrong . Please refresh and try again")
      return res.redirect(`/reset/${token}`);

    });
  });
router.get("/listing", async (req, res) => {
  const authenticated = req.isAuthenticated()
  const properties = await Properties.find({status : "published"})
  res.render("listings", {
    properties,
    moment,
    authenticated
  });
});
router.get("/listing/:slug", async (req, res) => {
  const authenticated = req.isAuthenticated()
  const {slug} = req.params
  const property = await Properties.findOne({slug})
  
  console.log({property})
  if(property){

    await Properties.findOneAndUpdate({slug}, {
      $set:{
        views : property.views + 1
      }
    })
    console.log(property)
    const total_amenities = property.amenities.length

    // const rows=  Math.round(Math.abs(total_amenities/(total_amenities/3)) )
    // console.log({rows})
    res.render("single_listing", {
    property,
    moment,
    total_amenities,
    authenticated
    });
  }else{
    res.redirect("/listing")
  }

});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.get('*', (req, res) => {
  res.status(404).render("admin/404page");
});


// router.post("/newsletter", async(req, res) => {
//     const {email} = req.body

//     const data = {
//         members:[
//           {
//             email_address:req.body.email,
//             status:"subscribed",
//             // merge_fields:{
//             //     FNAME:username,
//             // }
//           }
//         ]
//       }
//       const postData = JSON.stringify(data)
//       const options = {
//         url :"https://us19.api.mailchimp.com/3.0/lists/02e1d16e87",
//         method:'POST',
//         headers:{
//           Authorization:"auth API_KEY"
//         },
//         body:postData
//       };

//       request(options, (err, response,body)=>{
//         if(err){
//           console.log("MAILCHIMP: ERROR", err)
//         } else{
//           if(response.statusCode === 200){
//             console.log("SUCCESS")
//           } else {
//             console.log("FAILED")
//           }
//         }
//       })

// })

module.exports = router;
