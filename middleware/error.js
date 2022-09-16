const ErrorResponse = require( '../utils/errorResponse.js')

const errorHandler = (err, req, res, next) => {
    let error = {
      ...err
    }
    console.log(error)
    error.message = err.message
  
    console.log(err.stack);
    console.log(err);//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      // const message = `Resource not found with id of ${err.value}`;
      const message = `Resource not found`
      error = new ErrorResponse(message, 404)
    }
    // console.log(err.name);
  
    // Mongoose duplicate key
    if (err.code === 11000) {
      const message = 'Duplicate field value entered'
      // console.log(err)
      error = new ErrorResponse(message, 400)
    }
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = []
      Object.values(err.errors).forEach(errr => {
        message.push({
          field: errr.properties.path,
          message: errr.message
        })
      })
      error = new ErrorResponse(null, 400, message)
    }
  
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.messageWithField || error.message || 'Server Error',
      message: error.message
    })
  }
  
  module.exports = errorHandler