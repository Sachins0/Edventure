const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { mailSender, SuccessResponse, ErrorResponse } = require("../utils/common");
const crypto = require("crypto");
const bcrypt = require("bcrypt");


//resetPasswordToken
const resetPasswordToken = async (req, res) => {
    try {
        //email -> req.body
        const email = req.body.email;
        //check user and validate
        const user = await User.findOne({email});
        if(!user){
            ErrorResponse.message = `This email: ${email} is not registered With us. Enter a valid email `;
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //gen token
        const token = crypto.randomBytes(20).toString("hex");
        //update user by addding token and expiration time
        await User.findOneAndUpdate(
            {email},
            {
                token : token,
                resetPasswordExpires : Date.now() + 3600000
            },
            {new : true}
        );
        //create url
        const url = `https://edventure-sage.vercel.app//update-password/${token}`;
        //send mail containing url
        await mailSender(
            email,
            "Password Reset Link",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`
        )
        //return res
        SuccessResponse.message = 'Email sent, please change password from email';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = 'Error occurred while sending reset password email';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

//resetPassword
const resetPassword = async (req, res) => {
    try {
        //data fetch
        const {password, confirmPassword, token} = req.body;
        //validation
        if(password !== confirmPassword){
            ErrorResponse.message = 'Password and confirmPassword does not match';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //get user from Db using token
        const userDetails = await User.findOne({token});
        if(!userDetails){
            ErrorResponse.message = 'Token is invalid';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //expry check
        if(userDetails.resetPasswordExpires < Date.now()){
            ErrorResponse.message = 'Token is expired. Please regenerate the token';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //hash pwd
        const hashedPassword = await bcrypt.hash(password,10);
        //update new password
        await User.findOneAndUpdate(
            {token},
            {password : hashedPassword},
            {new : true}
        );
        //return res
        SuccessResponse.message = 'Password reset successfull';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = 'Error occurred while updating the password';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

module.exports = {
    resetPasswordToken,
    resetPassword
}