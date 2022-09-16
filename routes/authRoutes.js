const express = require('express')
const router = express.Router()

const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  googleAuth,
  validateEmail
} = require('../controllers/authController')

const { protect } = require('../middleware/auth')

router.post('/register', register)
router.post('/googleauth', googleAuth)
router.post('/login', login)
router.get('/logout',protect, logout)
router.post('/me', protect, getMe)
router.put('/updatedetails', protect, updateDetails)
router.put('/updatepassword', protect, updatePassword)
router.post('/forgotpassword', forgotPassword)
router.put('/resetpassword/:resettoken', resetPassword)
router.get('/verify/:validationtoken', validateEmail)

module.exports = router