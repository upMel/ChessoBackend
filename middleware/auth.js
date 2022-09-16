const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/userModel')

exports.protect = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }
  // Set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token
  }

  if (!token) {
    throw new ErrorResponse('Not authorized to access this route', 401)
  }
  // console.log(token)
  const isCustomAuth = token.length < 500;

  try {
    if (token && isCustomAuth) {
      // Verify token
      let decoded = jwt.verify(token, process.env.JWT_SECRET)
      // console.log('eee3')
      req.user = await User.findById(decoded.id)
      // console.log(req.user)
      next()
    } else {
      let decoded =jwt.decode(token)
      // console.log(decoded)
      req.user = decoded?.sub
      console.log(req.user)

    }
  } catch (err) {
    throw new ErrorResponse('Not authorized to access this route', 401)
  }
})

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ErrorResponse(
        `User role ${req.user.role} is not authorized to access this route`,
        403
      )

    }
    next()
  }
}