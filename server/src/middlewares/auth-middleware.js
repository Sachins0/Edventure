const {StatusCodes} = require('http-status-codes');
const jwt = require('jsonwebtoken');
const {ServerConfig} = require('../config');
const { ErrorResponse } = require('../utils/common');
const User = require('../models/User');

//auth
const auth = async (req, res, next) => {
   try {
     //extract token
     const token = req.cookies.token
                     || req.body.token
                     || req.header('Authorization').replace('Bearer ','');
 
     if(!token){
         ErrorResponse.message = 'Token is missing';
             return res
                     .status(StatusCodes.UNAUTHORIZED)
                     .json(ErrorResponse)
     };
     //verify token
     try {
        console.log("secret", ServerConfig.jwtSecret);
         const decode = await jwt.verify(token, ServerConfig.jwtSecret);
         console.log("decode", decode);
         req.user = decode;
     } catch (error) {
        console.log("error occured while verify token", error);
         ErrorResponse.error = error;
         ErrorResponse.message = 'Error occurred while verifying token';
         return res
                 .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                 .json(ErrorResponse);
     }
     next();

   } catch (error) {
    console.log("error in auth midd", error);
    ErrorResponse.error = error;
    ErrorResponse.message = ErrorResponse.message || 'Error occurred while authorizing user';
    return res
            .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
   }
}

//isStudent
const isStudent = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email });
        console.log("userDetails", userDetails);
        if(userDetails.accountType !== 'Student'){
            ErrorResponse.message = 'Route is protected for Students only';
             return res
                     .status(StatusCodes.UNAUTHORIZED)
                     .json(ErrorResponse)
        }
        
        next();

    } catch (error) {
        console.log("error in isStudent middleware", error);
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'User role cannot be verified';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

//isInstructor
const isInstructor = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email });
        if(userDetails.accountType !== 'Instructor'){
            ErrorResponse.message = 'Route is protected for Instructor only';
             return res
                     .status(StatusCodes.UNAUTHORIZED)
                     .json(ErrorResponse)
        }
        next();

    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'User role cannot be verified';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

//isAdmin
const isAdmin = async (req, res, next) => {
    try {
        const userDetails = await User.findOne({ email: req.user.email });
        if(userDetails.accountType !== 'Admin'){
            ErrorResponse.message = 'Route is protected for Admin only';
            return res
                     .status(StatusCodes.UNAUTHORIZED)
                     .json(ErrorResponse)
        }
        next();
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = 'User role cannot be verified';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}


module.exports = {
    auth,
    isStudent,
    isInstructor,
    isAdmin
}