const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')



const {
    uploadImage, updateProfile
} = require('../controllers/uploadController')



router.post('/',protect,uploadImage,updateProfile);

module.exports = router