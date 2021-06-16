const express = require('express')
const request= require("request")


var FroalaEditor = require("wysiwyg-editor-node-sdk/lib/froalaEditor.js");
const router = express.Router()


const BlogCategory = require("../models/BlogCategory");
const Downloadables = require("../models/Downloadable");
const Post = require('../models/Post');
const {Comment} = require('../models/Comment');

const moment = require("moment")
var csrf = require('csurf')
var csrfProtection = csrf({ cookie: true })

const isLoggedIn = require('../middleware/loggedIn');
let passport

passport = require('passport');
require('../config/passport')(passport);
const multer = require("multer")
// var upload = multer({ dest: 'uploads/' })
var cloudinary = require('cloudinary').v2;

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const News = require('../models/News');
const Downloadable = require('../models/Downloadable');




// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
  // cloud_name: process.env.CLOUD_NAME,
  // api_key: process.env.API_KEY,
  // api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  // params: {
  //   folder: "public",
  //   // fileFilter,
  //   // format: async (req, file) => 'img', // supports promises as well
  //   public_id: (req, file) => {
  //     // console.log(req.body)
  //     `blog-image-${Date.now()}`;
  //   },
  //   resource_type: "image",
  // },

  allowedFormats: ["jpg", "png", "jpeg"],
transformation: [{ width: 500, height: 500, crop: "limit" }]

});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpeg" ||
    file.mimetype == "image/mkv" ||
    file.mimetype == "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};


const parser = multer({ storage: storage });



router.get("/", async(req, res) => {
    res.render("index")
})
router.get("/about", async(req, res) => {
    res.render("about")
})

router.get("/gallery", async(req, res) => {
    res.render("gallery")
})

router.get("/contact", async(req, res) => {
    res.render("contact")
})
router.get("/listing", async(req, res) => {
    res.render("listings")
})
router.get("/:slug", async(req, res) => {
    res.render("single_listing")
})


router.post("/newsletter", async(req, res) => {
    const {email} = req.body
    
    const data = {
        members:[
          {
            email_address:req.body.email,
            status:"subscribed",
            // merge_fields:{
            //     FNAME:username,
            // }
          }
        ]
      }
      const postData = JSON.stringify(data) 
      const options = {
        url :"https://us19.api.mailchimp.com/3.0/lists/02e1d16e87",
        method:'POST',
        headers:{
          Authorization:"auth API_KEY"
        },
        body:postData
      };
  
      request(options, (err, response,body)=>{
        if(err){
          console.log("MAILCHIMP: ERROR", err)
        } else{
          if(response.statusCode === 200){
            console.log("SUCCESS")
          } else {
            console.log("FAILED")
          }
        }
      })
      
})

module.exports = router