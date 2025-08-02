const { StatusCodes } = require("http-status-codes");
const Course = require("../models/Course");
const { ErrorResponse, SuccessResponse } = require("../utils/common");
const RatingAndReview = require("../models/RatingAndReview");
const { default: mongoose } = require("mongoose");


//createRating
const createRating = async(req, res) => {
    try {
        //get userID
        const userId = req.user.id;
        //data -> req.body
        const {rating, review, courseId} = req.body;
        //check is user enrolled
        const courseDetails = await Course.findOne({
            _id: courseId,
            studentEnrolled : {$elemMatch: { $eq: userId }}
        });

        if(!courseDetails){
            ErrorResponse.message = 'Student is not enrolled in the course';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //not reviwed already
        const alreadyReviewed = await RatingAndReview.findOne({
            users : userId,
            course : courseId
        });
        if(alreadyReviewed){
            ErrorResponse.message = 'Student has already reviewed the course';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //create 
        const ratingReview = await RatingAndReview.create({
            rating, review, users: userId, course: courseId
        });
        //update course
        await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    ratingAndReviews: ratingReview._id
                }
            },
            {new: true}
        )
        //retun res
        SuccessResponse.data = ratingReview;
        SuccessResponse.message = 'raing and review created successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while creating rating and review';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};
//getAverageRating
const getAverageRating = async(req, res) => {
    try {
        //get courseId
        const courseId = req.body.courseId;
        //calc avg rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: {$avg: '$rating'}
                }
            }
        ])
        //return rating
        if(result.length> 0){
            //retun res
            SuccessResponse.data = result[0].averageRating;
            SuccessResponse.message = 'average rating fetched successfully';
            return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse);
        }

        //if no rating/review exists
        SuccessResponse.data = 0;
        SuccessResponse.message = 'average rating is 0, no rating given till now';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
        
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching average rating';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};
//getAllRating
const getAllRating = async(req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
                                .sort({rating: "desc"})
                                .populate({
                                    path: 'users',
                                    select: 'firstName lastName image email'
                                })
                                .populate({
                                    path: 'course',
                                    select: 'courseName'
                                })
                                .exec();
        SuccessResponse.data = allReviews;
        SuccessResponse.message = 'All reviews fetched successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching all reviews';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};

module.exports = {
    createRating,
    getAverageRating,
    getAllRating
}