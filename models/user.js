const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const referralCodes = require("referral-codes");

// Create Schema
var bcrypt = require("bcrypt-nodejs");

const UserSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    required: true,
    min: [6, "Too short to be a mail"],
    max: 25,
  },
  password: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  referrals: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],

  referralCode: {
    type: String,
  required : true
  },
  is_admin: {
    type: Boolean,
    default: false,
  },

  resetPasswordToken : {
    type : Number
  }
});

UserSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};
module.exports = SignupUser = mongoose.model("user", UserSchema);
