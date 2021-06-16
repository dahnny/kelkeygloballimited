const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema


const UserSchema = new Schema({



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
  referrals : [{
    type:Schema.Types.ObjectId,
    ref:'user'
}]





});

UserSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};


// checking if password is valid
UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};
module.exports = User = mongoose.model('user', UserSchema);