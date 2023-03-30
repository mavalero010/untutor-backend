const mongoose= require('mongoose')
const dotenv = require("dotenv")
dotenv.config() 
const connectDB = async () => {
    try {
        //txIIpvhdq8ojaYYh
        const cn = await mongoose.connect(process.env.MONGODB_CLUSTER_ACCESS);

        cn.STATES.connected
        ? console.log('MongoDB Conected')
        : console.log('Error in MongoDB');

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
module.exports = {
    connectDB
}