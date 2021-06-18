const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");

const propertiesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  
  slug: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "category",
  },

  status: {
    type: String,
    default: "draft",
  },
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },
  ],
  content: {
    type: String,
    required: true,
  },
  image_one: {
    type: String,
    default:
      "https://images.pexels.com/photos/2029694/pexels-photo-2029694.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260",
  },
  image_one_name: {
    type: String,
  },
  image_two: {
    type: String,
    default:
      "https://images.pexels.com/photos/2029694/pexels-photo-2029694.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260",
  },
  image_two_name: {
    type: String,
  },
  image_three: {
    type: String,
    default:
      "https://images.pexels.com/photos/2029694/pexels-photo-2029694.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260",
  },
  image_three_name: {
    type: String,
  },
  image_four: {
    type: String,
    default:
      "https://images.pexels.com/photos/2029694/pexels-photo-2029694.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260",
  },
  image_four_name: {
    type: String,
  },
  sold: {
    type: Boolean,
    default: false,
  },

  views: {
    type: Number,
    default: "0",
  },

  location: {
    type: String,
  },
  reviews: {
    type: Number,
    default: 3,
  },
  amenities : {
    type : Array,
    default : []
  },
  video : {
      type : String,
  },
  price : {
      type : Number,
      required:true
  },

  details: {
    bedrooms: {
      type: Number,
      default: 0,
    },
    bathrooms: {    
      type: Number,
      default: 0,
    },
    sqft_size: {
      type: Number,
      default: 0,
    }
  },
  
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

propertiesSchema.pre("save", function (next) {
  slug = slugify(this.title);
  this.slug = slug.toLowerCase();
  next();
});

function validatePost(post) {
  const schema = {
    title: Joi.string().min(5).max(250).required(), // validating title
    content: Joi.string().min(0).required(),
    likes: Joi.number().min(0),
    image: Joi.string(),
    category: Joi.objectId().required(), // validating owner id
    // comments:Joi.objectId().required()
  };
  return Joi.validate(post, schema);
}

// module.exports ={
//     Post : mongoose.model('Post', postSchema),
//     validate:validatePost
// }

module.exports = mongoose.model("Downloadable", downloadableSchema);

// exports.validate = validatePost;
