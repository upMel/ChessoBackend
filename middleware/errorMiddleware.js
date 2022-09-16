 const errorHandler = (err, req, res, next) => {
     const statusCode = res.statusCode ? res.statusCode : 500
        //if there is a statusCode then it is a client error else it is a server internal error
     res.status(statusCode)

     res.json({
         message: err.message,
         stack: process.env.NODE_ENV === 'production' ? null : err.stack,
     })
     //if in production mode don't show the stack 
 }

 export default errorHandler;