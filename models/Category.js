const mongoose = require('mongoose')
const Joi = require('joi')
const Schema = mongoose.Schema;

const slugify = require('slugify')

const CategorySchema = new Schema({   
    
    category_name:{
        type:String, 
        required:true    
    },
    slug:{
        type:String
    },
    date_created:{
        type:Date,
        default:Date.now
    },
    
    date_updated:{
        type:Date
    }

})


CategorySchema.pre("save", function(next) {
    slug = slugify(this.category_name);
    this.slug=slug.toLowerCase() 
    next();
  });

function validateBlogCategry(category){
    const schema = {
        category_name:Joi.string().min(3).max(100).required()
   }
   return Joi.validate(category, schema)
}



module.exports = mongoose.model('category', CategorySchema);
