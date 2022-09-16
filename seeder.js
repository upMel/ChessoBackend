const fs = require('fs')
const mongoose = require('mongoose')
const colors = require('colors')
const dotenv = require('dotenv')


// Load env vars
dotenv.config({ path: '../.env' })

const User =require('./models/userModel')
// const Post = require('./models/Post')
// const Comment = require('./models/Comment')
console.log(process.env.MONGO_URI)
mongoose.connect(process.env.MONGO_URI)

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
)

// const posts = JSON.parse(
//   fs.readFileSync(`${__dirname}/_data/posts.json`, 'utf-8')
// )
// const comments = JSON.parse(
//   fs.readFileSync(`${__dirname}/_data/comments.json`, 'utf-8')
// )

const importData = async () => {
  try {
    await User.create(users)
    // await Post.create(posts)
    // await Comment.create(comments)

    console.log('Data Imported...'.green.inverse)
    process.exit()
  } catch (err) {
    console.error(err)
  }
}

const deleteData = async () => {
  try {
    await User.deleteMany()
    // await Post.deleteMany()
    // await Comment.deleteMany()

    console.log('Data Destroyed...'.red.inverse)
    process.exit()
  } catch (err) {
    console.error(err)
  }
}

if (process.argv[2] === '-i') {
  // node seeder -i
  importData()
} else if (process.argv[2] === '-d') {
  // node seeder -d
  deleteData()
}