const mongoose = require ('mongoose')

const DBConnection = async () => {
    try{
        const conn = await mongoose
        .connect(process.env.MONGO_URI)
        console.log(`MongoDB  connected : ${conn.connection.host}`.magenta.underline.bold);
    }
    catch(error){
        console.log(error);
        process.exit(1)

    }
}
module.exports = DBConnection