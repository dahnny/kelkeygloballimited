const express = require("express");
const request = require("request");

var FroalaEditor = require("wysiwyg-editor-node-sdk/lib/froalaEditor.js");
const router = express.Router();

const moment = require("moment");
var csrf = require("csurf");
var csrfProtection = csrf({ cookie: true });

const isLoggedIn = require("../middleware/loggedIn");
let passport;

passport = require("passport");
require("../config/passport")(passport);
const multer = require("multer");
// var upload = multer({ dest: 'uploads/' })
var cloudinary = require("cloudinary").v2;

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
  // console.log("Referral ID",req.query['referral'])
  // render the page and pass in any flash data if it exists
  return res.render("admin/Register", {
    signupMessage: req.flash("signupMessage"),
    successMessage: req.flash("successMessage"),
    title: "Log-In",
    csrfToken: req.csrfToken(),
  });
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
  res.render("admin/dashboard", {
    property_length,
    user_length,
    valuation,
    popular_properties,
  });
});

router.get("/dashboard/add-property", isLoggedIn, async (req, res) => {
  try {
    var categories = await Category.find();
    console.log({ categories });

    res.render("admin/Addproperty", {
      categories,
      message: req.flash("error"),
      successMessage: req.flash("success"),
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

router.get("/dashboard/properties", isLoggedIn, async (req, res) => {
  // var post_length = await (await Post.find()).length
  // var posts = await Post.find()

  // var views =await posts.reduce((n, {views}) => n + views, 0)

  // var published = await (await Post.find({status : "published"})).length

  // console.log({views })
  var all_properties = await Properties.find();
  res.render("admin/Properties", {
    all_properties,
    message: req.flash("error"),
    successMessage: req.flash("success"),
    moment
    // post_length,
    // views,
    // published
  });
});

router.get(
  "/dashboard/properties/:id/publish",
  isLoggedIn,
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

router.get(
  "/dashboard/properties/:id/unpublish",
  isLoggedIn,
  async (req, res) => {
    const { id } = req.params;
    if (!id) {
      req.flash("error", "Something went wrong");
      return res.redirect("/dashboard/properties");
    }

    await Properties.findByIdAndDelete(id);

    req.flash("success", "Property has been deleted successfully");
    return res.redirect("/dashboard/properties");
  }
);

router.get("/dashboard/properties/:slug", isLoggedIn, async (req, res) => {
  const {slug} = req.params
  var property = await Properties.findOne({ slug }).populate("category");

  res.render("admin/Property", {
    property,
    moment
  });
});

router.get("/dashboard/users", isLoggedIn, async (req, res) => {
const  users = await SignupUser.find()
  // var posts = await Post.find()

  // var views =await posts.reduce((n, {views}) => n + views, 0)

  // var published = await (await Post.find({status : "published"})).length

  // console.log({views })
  res.render("admin/Users", {
    users,
    moment,
    message: req.flash("error"),
    successMessage: req.flash("success"),

    // post_length,
    // views,
    // published
  });
});
router.post("/dashboard/create-category", isLoggedIn, async (req, res) => {
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
  res.render("index");
});
router.get("/about", async (req, res) => {
  res.render("about");
});

router.get("/contact", async (req, res) => {
  res.render("contact");
});
router.get("/listing", async (req, res) => {
  const properties = await Properties.find()
  res.render("listings", {
    properties,
    moment
  });
});
router.get("/listing/:slug", async (req, res) => {
  const {slug} = req.params
  const property = Properties.findOne({slug})
  
  if(property){

    await Properties.findOneAndUpdate({slug}, {
      $set:{
        views : property.views + 1
      }
    })
    const total_amenities = property.amenities.length

    const rows=  Math.round(Math.abs(total_amenities/(total_amenities/3)) )
    console.log({rows})
    res.render("single_listing", {
    property
    });
  }else{
    res.redirect("/listing")
  }

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
