const mongoose = require('mongoose');
const {mailSender} = require('../utils/common');
const {emailVerificationTemplate} = require('../mail/templates')

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5 // 5 minutes
    }
});

async function sendVerificationEmail(email, otp) {
    // send email
    try {
        const mailResponse = await mailSender(email, 'Verification email from Edventure', emailVerificationTemplate(otp));
    } catch (error) {
        console.log('error while sending email', error);
        throw error;
    }
};

OTPSchema.pre('save', async function (next) {
    await sendVerificationEmail(this.email, this.otp);
    next();
});

module.exports = mongoose.model('OTP', OTPSchema);