// import mongoose from "mongoose";

// const userSchema = mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'Please add a name'],
//     },
//     email: {
//       type: String,
//       required: [true, 'Please add an email'],
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: [true, 'Please add a password'],
//     },
//   },
//   {
//     timestamps: true,
//   }
// )

// export default mongoose.model("User",userSchema);

const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Schema= mongoose.Schema

const UserSchema = new Schema (
    {
        firstName :{
            type: String, 
            required : [true , 'Please add a first Name']
        },
        lastName :{
            type : String , 
            required :[true , 'Please add a last Name']
        },
        email :{
            type : String ,
            required : [true , 'Please add an email '],
            unique :true ,
            match : [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
              ]
        },
        //////////////////////////////////////////////////////////
        inQueue:{
            type : Boolean,
            default : false
        },
        isOnline:{
            type : Boolean,
            default : false
        },
        inGame:{
            type : Boolean,
            default : false,
            required:true
        },
        picture:{
            type:String,
        },
        sub:{  
            type: String,
            index: { unique: true, sparse: true },
            // unique:true,
            
        },
        elo:{  
            type: Number,
            default: 1200,
        },
        isValid:{
            type: Boolean,
            default : false
        },
        ///////////////////////////////////////////////////////////
        role : {
            type :String ,
            enum:['guest','admin'] ,
            default : 'guest'
        },
        password : {
            type :String, 
            // required : [true, 'Please add a password'],
            // minlength : [6, "Must be at least 6 characters long"],
            select : false 
        },
        resetPasswordToken : String ,
        validateToken : String ,
        resetPasswordExpire : Date ,
    },
    {
        timestamps : true
    }
)
// Schema.plugin(require('mongoose-beautiful-unique-validation'));
//Encryption of password 

UserSchema.pre('save',async function (next){
    if (!this.isModified('password')){
        next()
    }
    
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

UserSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}

UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    })
  }

UserSchema.methods.getResetPasswordToken = function (){
    //Generate token
    const resetToken = crypto.randomBytes(20).toString('hex')

    //Hash the token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    
    //set expire 
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000
    
    return resetToken
}

UserSchema.methods.getValidationToken = function (){
    //Generate validation token
    const validationToken= crypto.randomBytes(10).toString('hex')

    this.validateToken =crypto
        .createHash('sha256')
        .update(validationToken)
        .digest('hex')

    return validationToken
}

module.exports = mongoose.model('User',UserSchema)

