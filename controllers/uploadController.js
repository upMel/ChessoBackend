const asyncHandler = require('express-async-handler')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/userModel')
const multer = require("multer")
const path = require('path');
const fs = require('fs')
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'backend/public/')
    },
    filename: (req, file, cb) => {
        // console.log(req.user)
        cb(null, req.user._id + '_'+Date.now()+path.extname(file.originalname));
        // console.log('req.body.name')
    },
});

const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
    fileFilter: function(req,file,cb){
        checkFileType(file,cb);
    }
}).single('file');


// Check File Type
function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
    console.log(file)
    
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb( new ErrorResponse('Images only', 403));
        // throw new ErrorResponse('Email already exists', 409)
    }
  }
  

exports.uploadImage = upload

exports.updateProfile = asyncHandler(async (req, res) => {
    console.log(req.file);
    console.log(req.user);

    if(req.file == undefined){
        throw new ErrorResponse('No file selected',400)
    }
    console.log(req.file.path)
    console.log(req.user.picture)
    if(req.user.picture){
    if(!req.user.picture.includes('googleusercontent') ){
        const prevPic = req.user.picture.slice(req.user.picture.indexOf(req.user._id))
        console.log(prevPic)
        await unlinkAsync(`backend/public/${prevPic}`)
    }}
    const fieldsToUpdate = {
        picture:`http://localhost:5000/public/${req.file.filename}`
    }
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    }).catch(err => {
        res.status(400).json({ success: false, data: 'No user with that id' })
    })
    console.log(user)

    await user.save()
    sendTokenResponse(user,200,res)
    // res.status(200).json("file uploaded")
    
})


const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken()
    const result = user
    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    if (process.env.NODE_ENV = 'production') {
        options.secure = true
    }

    res
        .status(statusCode)
        
        .cookie('token', token,{
            secure: false,
            expires: new Date(
                Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        }  )
        .json({ result, success: true, token })
}