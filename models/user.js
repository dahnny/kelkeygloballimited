const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema


const UserSchema = new Schema({

user : {

  email: {
    type: String,
    lowercase : true,
    required : true,
    min: [6, 'Too short to be a mail'],
    max: 25
  },
  password :{
    type : String,
    required: true
  },
  first_name : {
    
    type : String,
    required: true
  },
 last_name : {
    
    type : String,
    required: true
  },
  referrals : 


},




});
module.exports = User = mongoose.model('user', UserSchema);