const { StatusCodes } = require("http-status-codes");
const Profile = require("../models/Profile");
const { SuccessResponse, ErrorResponse, uploadImageToCloudinary} = require("../utils/common");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");
const serverConfig = require("../config/server-config");
const { convertSecondsToDuration } = require("../utils/common/secToDuration");


const updateProfile = async(req, res) => {
    try {
        console.log("updateProfile called", req.body);
        //fetch data
        const {
          firstName = "",
          lastName = "",
          dob = "",
          about = "",
          contactNumber = "",
          gender = "",
        } = req.body
        const id = req.user.id;
        //validation
        //find profileId
        const user = await User.findById(id);
        const profileId = user.profile;
        //update 
        await Profile.findByIdAndUpdate(profileId, {gender, dob, about, contactNumber}, {new : true});
        const updatedUser = await User.findByIdAndUpdate(id, {
          firstName,
          lastName,
        })
        await updatedUser.save()

        /*{
        another method to update
        cost profileDetails = await Profile.findById(profileId);
        profileDetails.gender = gender
        profileDetails.dob = dob
        profileDetails.about = about
        profileDetails.contactNumber = contactNumber
        await ProfileDetails.save();
        }*/

        const updatedUserDetails = await User.findById(id)
        .populate("profile")
        .exec()
        //return res
        SuccessResponse.data = updatedUserDetails;
        SuccessResponse.message = 'Profile is updated successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    } catch (error) {
      console.log('Error in updateProfile:', error);
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while updating profile';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};

//deleteAccount
const deleteAccount = async (req, res) => {
    try {
         //data fetch
         const userId = req.user.id;
         //find ProfileId
         const user = await User.findById(userId);
         //validation
         if (!user) {
            ErrorResponse.message = 'User not found';
            return res
                    .status(StatusCodes.NOT_FOUND)
                    .json(ErrorResponse)
          }
         //delete Profile
         await Profile.findByIdAndDelete({_id: user.profile});
         //uneroll user from all courses
         for (const courseId of user.courses) {
            await Course.findByIdAndUpdate(
              courseId,
              { $pull: { studentEnrolled: userId } },
              { new: true }
            )
          }
         //delete User
         await User.findByIdAndDelete(userId);
         await CourseProgress.deleteMany({ userId })
         //return res
         SuccessResponse.data = "";
         SuccessResponse.message = 'Account is deleted successfully';
         return res
                 .status(StatusCodes.OK)
                 .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while deleting account';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};

const getAllUserDetails = async (req, res) => {
    try {
      const id = req.user.id
      const userDetails = await User.findById(id)
        .populate("profile")
        .exec()
      console.log(userDetails)
      SuccessResponse.message = 'User data fetched successfully';
      SuccessResponse.data = userDetails;
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching user data';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
  }
  
 const updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        serverConfig.folderName,
        1000,
        1000
      )
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      SuccessResponse.message = 'Image updated successfully';
      SuccessResponse.data = updatedProfile;
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while updating image';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
  }
  
const getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      let userDetails = await User.findOne({
        _id: userId,
      })
        .populate({
          path: "courses",
          populate: {
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          },
        })
        .exec()
      userDetails = userDetails.toObject()
      var SubsectionLength = 0
      for (var i = 0; i < userDetails.courses.length; i++) {
        let totalDurationInSeconds = 0
        SubsectionLength = 0
        for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
          totalDurationInSeconds += userDetails.courses[i].courseContent[
            j
          ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
          userDetails.courses[i].totalDuration = convertSecondsToDuration(
            totalDurationInSeconds
          )
          SubsectionLength +=
            userDetails.courses[i].courseContent[j].subSection.length
        }
        let courseProgressCount = await CourseProgress.findOne({
          courseID: userDetails.courses[i]._id,
          userId: userId,
        })
        courseProgressCount = courseProgressCount?.completedVideos.length
        if (SubsectionLength === 0) {
          userDetails.courses[i].progressPercentage = 100
        } else {
          // To make it up to 2 decimal point
          const multiplier = Math.pow(10, 2)
          userDetails.courses[i].progressPercentage =
            Math.round(
              (courseProgressCount / SubsectionLength) * 100 * multiplier
            ) / multiplier
        }
      }
  
      if (!userDetails) {
        ErrorResponse.message = `Could not find user with id: ${userDetails}`;
        return res
                .status(StatusCodes.NOT_FOUND)
                .json(ErrorResponse)
      }
      SuccessResponse.message = 'Enrolled courses fetched successfully';
      SuccessResponse.data = userDetails.courses;
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        console.log("Error in getEnrolledCourses:", error);
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching enrolled courses';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
  }
  
const instructorDashboard = async (req, res) => {
    try {
      const courseDetails = await Course.find({ instructor: req.user.id })
  
      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course.studentEnrolled.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price
  
        // Create a new object with the additional fields
        const courseDataWithStats = {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          // Include other course properties as needed
          totalStudentsEnrolled,
          totalAmountGenerated,
        }
  
        return courseDataWithStats
      })
  
      SuccessResponse.data = courseData;
        res
            .status(StatusCodes.OK)
            .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching instructor dashboard data';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

module.exports = {
    updateProfile,
    deleteAccount,
    getAllUserDetails,
    updateDisplayPicture,
    getEnrolledCourses,
    instructorDashboard
    
}