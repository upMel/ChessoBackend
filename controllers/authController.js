const crypto = require('crypto')
const asyncHandler = require('express-async-handler')
const ErrorResponse = require('../utils/errorResponse')
const sendEmail = require('../utils/sendEmail')
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const User = require('../models/userModel')


// @desc    Register-login google user
// @route   POST /api/auth/googleauth
// @access  Public
exports.googleAuth = asyncHandler(async (req, res) => {

    const { token } = req.body
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { given_name, family_name, email, role, sub, picture } = payload
    let user = await User.findOne({ email })
   
    if (user && !user?.sub) {
        throw new ErrorResponse('Email already exists', 409)
    }
   
    if (!user) {
        user = await User.findOneAndUpdate({ email },
            {
                firstName: given_name,
                lastName: family_name,
                sub,
                picture,
                email,
                role
            }, {
            upsert: true,
            new: true
        })
    }

    user.isValid = true // axreiasto giati den tsekarei to validation to google login alla kalo einai na fainetai sthn vash
    user.isOnline = true
    await user.save()
    sendTokenResponse(user, 200, res)
})



// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
    //destructure all the necessary data
    const { firstName, lastName, email, password, role ,picture} = req.body
    //find the user by email in the database
    let user = await User.findOne({ email })
   //if user with that email already exists throw an error 
    if (user) {
        throw new ErrorResponse('Email already exists', 409)
    }

    //else create a new user in the database
    user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role,
        picture
    })
    //in order to login with the new email you need to validate your email
    //in user schema there is a method that generates a unique token
    const validationToken = user.getValidationToken()
    await user.save({ validateBeforeSave: false })
    const url = req.headers.referer
    const validUrl = `${url}verify/${validationToken}`
    const getTemplateHTML = require('../utils/email-template')
    //send the email with the help of sendEmail in utils
    await sendEmail({
        email: user.email,
        subject: 'Validate your email',
        html:getTemplateHTML(validUrl),
        url:validUrl,
    })
    res.status(200).json({ success: true, data: 'Verification email sent' })
})



// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    
    if (!email || !password) {
        throw new ErrorResponse('Please provide an email and password', 400)
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        throw new ErrorResponse('Invalid credentials', 400)
    }
    if(user.sub){
        throw new ErrorResponse('This is a gmail account. Sign in using google sign in',403)
    }
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
        throw new ErrorResponse('Invalid credentials password is wrong', 400)
    }
    if(!user.isValid){
        throw new ErrorResponse('Email is not verified',403)
    }
    // if(user.isOnline){
    //     throw new ErrorResponse('Someone is already connected',409)
    // }
    user.isOnline = true
    await user.save()

    sendTokenResponse(user, 200, res)
})

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Public
exports.logout = asyncHandler(async (req, res) => {
    // console.log('eee')
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    // console.log('eee')
    const user = req.user
    user.isOnline = false
    await user.save()
    // console.log(user)


    res.status(200).json({ success: true, data: {} })
})

// @desc    Get current logged in user
// @route   POST /api/auth/me
// @access  Public
exports.getMe = asyncHandler(async (req, res) => {
    const user = req.user
    console.log(Date(Date.now()))//<<<<<<<<<<<<<<<<<<<<<<<<<<<
    res.status(200).json({ success: true, data: user })
})

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Public
exports.updateDetails = asyncHandler(async (req, res) => {
    const fieldsToUpdate = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    }).catch(err => {
        res.status(400).json({ success: false, data: 'Email already exists' })
    })
    sendTokenResponse(user, 200, res)
    // res.status(200).json({ success: true, data: user })
})

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password')

    if (!(await user.matchPassword(req.body.currentPassword))) {
        throw new ErrorResponse('Current password is incorrect', 401)
    }

    user.password = req.body.newPassword
    await user.save()//when i save the user the password is encrypted check user model 

    sendTokenResponse(user, 200, res)
})

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        throw new ErrorResponse('There is no user with that email', 404)
    }
    if (user && user?.sub) {
        throw new ErrorResponse('This is a google account', 403)
    }

    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })
    console.log(req.headers)
    console.log(req.protocol)

    const resetUrl1 = `${req.protocol}://${req.get('host')}
    /api/auth/resetPassword/${resetToken}`
    const url = req.headers.referer
    const resetUrl = `${url}resetPassword/${resetToken}`
    console.log(resetUrl)

    // const message =`<div style="display:flex "><h1>Reset Password</h1><br>
    // <p>Someone (hopefully you) has requested a password reset for your Chesso account.
    //  Follow the link below to set a new password:</p> <p><a href="${resetUrl}">Click here to reset password ${resetUrl}</a></p>
    //  <p>If you don't wish to reset your password,
    //   disregard this email and no action will be taken.</p>
    //   </div>`



    // style="display:flex; flex-direction:column; align-items: center; "
    const message = `
        <div >
            <img src="cid:chesso.png" alt="placeholder" width="45" height="45" >
            <h2>Reset Password</h2>
            
            <p>Someone (hopefully you) has requested a password reset for your Chesso account.
                Follow the link below to set a new password:</p>
            <a href="${resetUrl}"><button>Click here to reset password</button></a>
            <p>If you don't wish to reset your password,
                disregard this email and no action will be taken.</p>
        </div>`
    const getTemplateHTML = require('../utils/reset-template')

    try {
        await sendEmail({
            email: user.email,
            subject: 'Reset your Chesso password',
            html:getTemplateHTML(resetUrl),
            url:resetUrl,
        })
        res.status(200).json({ success: true, data: 'An email has been sent to you to change your password' })
    } catch (err) {
        console.log(err)
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave: false })

        throw new ErrorResponse('Email could not be sent', 500)
    }
})

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
    //Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex')

    console.log(resetPasswordToken)

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        throw new ErrorResponse('invalid token', 400)
    }

    //Set new password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user, 200, res)
})


// @desc    Verify email
// @route   GET /api/auth/verify/:validationtoken
// @access  Public
exports.validateEmail = asyncHandler (async(req,res)=>{
    const verificationToken = crypto
        .createHash('sha256')
        .update(req.params.validationtoken)
        .digest('hex')

        console.log(verificationToken)

        const user = await User.findOne({
            validateToken:verificationToken
        })
        console.log(user)
    
        if (!user) {
            throw new ErrorResponse('You already verified', 400)
        }
        
        user.isValid = true
        user.validateToken = undefined
        await user.save()

        sendTokenResponse(user, 200, res)
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
        // .cookie('token',token , options ) gia kapoio logo otan to pernaw me metavlhth
        //  ta options sto postman den mou emfanizei to cookie san cookie 
        // alla ws header sto set cookie enw me to na grapsw egw ta options to response 
        // exei kai ws cookie kai ws set cookie

        .cookie('token', token, {
            secure: false,
            expires: new Date(
                Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        })
        .json({ result, success: true, token })
}