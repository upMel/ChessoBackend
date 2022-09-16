// import express from "express";
// const router = express.Router();
// import {deleteUser, getUsers, setUser, updateUser} from '../controllers/userController.js';

// //Routes grouped by route
// //@route :"/user"
// router.route('/').get(getUsers).post(setUser)

// //@route :"/user/:id"
// router.route('/:id').put(updateUser).delete(deleteUser)

// //Routes non-grouped in line
// // router.get('/',getUsers);
// // router.post('/',setUser);
// // router.put('/:id',updateUser);
// // router.delete('/:id',deleteUser);

// export default router;

const express = require('express')
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController')

const User = require('../models/userModel')

const router = express.Router({ mergeParams: true })

const advancedResults = require('../middleware/advancedResults')

router
  .route('/')
  .get(advancedResults(User),getUsers)

router  
  .route('/:id')
  .delete(deleteUser)

const { protect, authorize } = require('../middleware/auth')

router.use(protect)
router.use(authorize('admin'))

router
  .route('/admin')
  .get(advancedResults(User), getUsers)
  .post(createUser)

router
  .route('/admin/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser)

module.exports = router