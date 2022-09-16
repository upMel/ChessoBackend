const asyncHandler = require('express-async-handler')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/userModel')
const fs = require('fs')
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)

//@desc Get all users
//@route GET /api/users
//@access Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
    res.status(200).json(res.advancedResults)
})

//@desc Get a single user by id
//@route GET /api/users/:id
//@access Private/Admin
exports.getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (!user) {
        throw new ErrorResponse(`No user with that id of ${req.params.id}`, 404)
    }
    res.status(200).json({ success: true, data: user })
})


//@desc Create user
//@route POST /api/users
//@access Private/Admin
exports.createUser = asyncHandler(async (req, res) => {

    // console.log(req.body)

    const user = await User.create(req.body)

    res.status(201).json({ success: true, data: user })
})

//@desc Update user
//@route PUT /api/users/:id
//@access Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
    req.body.password = ''
    delete req.body.password

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    }).select('+password')//<<<thelw o admin na mporei na dei to password?

    if (!user)
        throw new ErrorResponse(`No user with that id of ${req.params.id}`)
        
    res.status(200).json({ success: true, data: user })
})

//@desc Delete user
//@route DELETE /api/users/:id
//@access Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (!user)
      throw new ErrorResponse(`No user with that id of ${req.params.id}`,404)
    // Edw mporw me enan elegxo na diagrafei kai to pic an exei anevasei custom 
    //kai den einai to google profile picture tou .

    //   await unlinkAsync(`backend/public/${prevPic}`)
    
    await User.findByIdAndDelete(req.params.id)
  
    res.status(200).json({ success: true, data: {} })
})