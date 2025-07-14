const User = require('../models/User');
const OTP = require('../models/OTP');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse,ErrorResponse, mailSender} = require('../utils/common');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');
const {ServerConfig} = require('../config');
const { passwordUpdated } = require('../mail/templates/passwordUpdate');


//sendOTP
const sendOTP = async (req,res) => {
   try {
     //1.email -> req.body
     const {email} = req.body;
     //2.already exist user
     const checkUserPresent = await User.findOne({email});
     ErrorResponse.message = 'User is already registered';
     if(checkUserPresent){
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(ErrorResponse)
     }
     //3.otp generate
     let otp = otpGenerator.generate(6, {
        upperCaseAlphabets : false,
        lowerCaseAlphabets : false,
        specialChars : false
     })

     //4.check otp unique
     let result = await OTP.findOne({otp});
     while(result){
        otp = otpGenerator.generate(6, {
            upperCaseAlphabets : false,
            lowerCaseAlphabets : false,
            specialChars : false
        });
        result = OTP.findOne({otp});
     }
     //5.store OTP in DB
     const otpPayload = {email,otp};
     const otpBody = await OTP.create(otpPayload);

     SuccessResponse.data = otp;
     SuccessResponse.message = 'OTP created successfully';
     return res
            .status(StatusCodes.CREATED)
            .json(SuccessResponse);
   } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'OTP cannot be generated. Please try again.';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
   }
}

//signUp
const signUp = async (req,res) => {
    try {
        //data -> req.body
        const {firstName, lastName, password, confirmPassword, accountType, email, otp, contactNumber} = req.body;
        //validate
        if (
            [firstName, lastName, email, confirmPassword, password, contactNumber].some((field) => field?.trim() === "")
        ) {
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        if(password !== confirmPassword){
            ErrorResponse.message = 'Password and confirmPassword does not match';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //check already existing user
        const checkUserPresent = await User.findOne({email});
        if(checkUserPresent){
            ErrorResponse.message = 'User is already registered';
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json(ErrorResponse)
         }
        //find most recent OTP and validate it
        const recentOtp = await OTP.find({email}).sort({createdAt : -1}).limit(1);
        if(recentOtp.length == 0){
            ErrorResponse.message = 'OTP not found. Incorrect email or OTP expired';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse);
        }else if(otp !== recentOtp[0].otp){
            ErrorResponse.message = 'Incorrect OTP';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse);
        }
        //Hash password
        const hashedPassword = await bcrypt.hash(password,10);
        // Create the user
        let approved = ""
        approved === "Instructor" ? (approved = false) : (approved = true)
        //create entry in DB
        const profileDetails = await Profile.create({
            gender : null,
            dob : null,
            about : null,
            contactNumber : null,
        });

        const user = await User.create({
            firstName, lastName, email, accountType, contactNumber, approved,
            password: hashedPassword,
            profile: profileDetails._id,
            image : `https://api.dicebear.com/9.x/initials/svg?seed=${firstName}%20${lastName}`,
        })
        //return res
        SuccessResponse.data = user;
        SuccessResponse.message = 'user is registered successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    
    } catch (error) {
        console.log("error in signUp:", error);
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'User cannot be registered. Please try again.';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}


//login
const login = async (req,res) => {
    try {
        //data -> req.body
        const {email, password} = req.body;
        //validation
        if(!email || !password){
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //check in DB
        const user = await User.findOne({email}).populate('profile');
        if(!user){
            ErrorResponse.message = 'User is not registered, please SignUp first';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //gen JWT and do password match
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email : user.email,
                id : user._id,
                accountType : user.accountType
            };
            const token = jwt.sign(payload, ServerConfig.jwtSecret, {
                expiresIn : '2h'
            });
            user.token = token;
            user.password = undefined;

            //return res and send cookies
            const options = {
                expires : new Date(Date.now() + 3*24*60*60*1000),
                httpOnly : true
            };
            SuccessResponse.data = user, token;
            SuccessResponse.message = 'Logged in successfully';
            return res
                    .cookie("token", token, options)
                    .status(StatusCodes.OK)
                    .json(SuccessResponse);
        }
        else{
            ErrorResponse.message = 'password is incorrect';
            return res
                    .status(StatusCodes.UNAUTHORIZED)
                    .json(ErrorResponse)
        }
        
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Login unsuccessfull. Please try again.';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

//changePassword
const changePassword = async (req, res) => {
    try {
        // Get user data from req.user
        const userDetails = await User.findById(req.user.id)
        //data -> req.body
        const {oldPassword, newPassword} = req.body;
        //validate
        if(!oldPassword || !newPassword){
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        // Validate old password
        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password)
        if(!isPasswordMatch){
            ErrorResponse.message = 'Old password is incorrect';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //update new pass in DB
        const hashedPassword = await bcrypt.hash(newPassword,10);
        const updatedUserDetails = await User.findByIdAndUpdate(
                                            req.user.id,
                                            { password: hashedPassword },
                                            { new: true }
                                        );
        //send mail
        try {
            const emailResponse = await mailSender(
              updatedUserDetails.email,
              "Password for your account has been updated",
              passwordUpdated(
                updatedUserDetails.email,
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
              )
            )
            console.log("Email sent successfully:", emailResponse.response)
          } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error)
            ErrorResponse.error = error;
            ErrorResponse.message = ErrorResponse.message || 'Error occurred while sending email. Please try again.';
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
          }
        //return res
        SuccessResponse.data = "";
        SuccessResponse.message = 'Password updated successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        console.log('error in changePassword:', error);
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while updating password';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

module.exports = {
    sendOTP,
    signUp,
    login,
    changePassword
}