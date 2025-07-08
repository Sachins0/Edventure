const dotenv = require('dotenv');   
dotenv.config();

module.exports = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGO_URI,
    mailHost: process.env.MAIL_HOST,
    mailUser: process.env.MAIL_USER,
    password: process.env.MAIL_PASS,
    jwtSecret : process.env.JWT_SECRET,
    folderName : process.env.FOLDER_NAME,
    razorpayKey : process.env.RAZORPAY_KEY,
    razorpaySecret : process.env.RAZORPAY_SECRET,
    cloudinaryName : process.env.CLOUD_NAME,
    cloudinaryKey : process.env.CLOUD_API_KEY,
    cloudinarySecret : process.env.CLOUD_API_SECRET,
}