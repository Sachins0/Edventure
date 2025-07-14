const { StatusCodes } = require("http-status-codes");
const Course = require("../models/Course");
const { SuccessResponse, ErrorResponse, uploadImageToCloudinary } = require("../utils/common");
const { convertSecondsToDuration } = require("../utils/common/secToDuration");
const { ServerConfig } = require("../config");
const User = require("../models/User");
const Category = require("../models/Category");
const CourseProgress = require("../models/CourseProgress");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { get } = require("mongoose");


//create
const createCourse = async (req, res) => {
    try {
        const userId = req.user.id
        //data req.body
        let {courseName, courseDescription, whatYouWillLearn, price, category, tag: _tag, status, instructions: _instructions} = req.body;
        //thumbnail req.file
        const thumbnail = req.files.thumbnailImage;
        const tag = JSON.parse(_tag)
        const instructions = JSON.parse(_instructions)
        //validate
        if(
            [courseName, courseDescription, whatYouWillLearn, price, category].some((field) => field?.trim() === '')
          ){
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        
        if (!status) {
          status = "Draft"
        }
        // Check if the user is an instructor
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor",
        })
        if (!instructorDetails) {
            ErrorResponse.message = 'Instructor is not found';
            return res
                    .status(StatusCodes.NOT_FOUND)
                    .json(ErrorResponse)
        }
        // Check if the tag given is valid
        const categoryDetails = await Category.findById(category)
        if (!categoryDetails) {
            ErrorResponse.message = 'Categoty details not found';
            return res
                    .status(StatusCodes.NOT_FOUND)
                    .json(ErrorResponse)
        }
        
        //upload thumbnail to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, ServerConfig.folderName);
        //create entry in DB
        const newCourse = await Course.create({
            courseName, courseDescription, 
            instructor : instructorDetails._id,
            whatYouWillLearn, price, tag,
            thumbnail : thumbnailImage.secure_url,
            category : categoryDetails._id, 
            status, instructions
        });
        //add new course to instructor
        await User.findByIdAndUpdate(
            {_id : instructorDetails._id},
            {
                $push : {
                    courses : newCourse._id
                }
            },
            {new : true}
        );
        //update category schema
        await Category.findByIdAndUpdate(
            {_id : category},
            {
                $push : {
                    course : newCourse._id
                }
            },
            {new : true}
        );
        //return res
        SuccessResponse.data = newCourse;
        SuccessResponse.message = 'Course is created successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = 'Error occurred while creating course';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

// Edit Course Details
const editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        ErrorResponse.message = 'Course not found';
        return res
                .status(StatusCodes.NOT_FOUND)
                .json(ErrorResponse)
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          ServerConfig.folderName
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({_id: courseId})
        .populate({
          path: "instructor",
          populate: {
            path: "profile",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
        SuccessResponse.data = updatedCourse;
        SuccessResponse.message = 'Course is updated successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while updating course';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
  }

//getAllCourse
const showAllCourses = async (req, res) => {
    try {
        //find All
        const courses = await Course.find( { status: "Published" },{}).populate('instructor').exec();
        SuccessResponse.data = courses;
        SuccessResponse.message = 'All courses returned successfully';
            return res
                    .status(StatusCodes.CREATED)
                    .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching all courses';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

//get CourseDetails
const getCourseDetails = async(req, res) => {
    try {
    const { courseId } = req.body
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "profile",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl",
        },
      })
      .exec()

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

const getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user.id
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "profile",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    console.log("courseProgressCount : ", courseProgressCount)

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
}
}

// Get a list of Course for a given Instructor
const getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 })
  
      // Return the instructor's courses
        SuccessResponse.data = instructorCourses
        SuccessResponse.message = 'Instructor Course is fetched successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching intsructor courses';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
  }

// Delete the Course
const deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        ErrorResponse.message = 'Course not found';
        return res
                .status(StatusCodes.NOT_FOUND)
                .json(ErrorResponse)
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      SuccessResponse.data = "";
        SuccessResponse.message = 'Course is deleted successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while deleting course';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
  }

module.exports = {
    createCourse,
    showAllCourses,
    getCourseDetails,
    getFullCourseDetails,
    editCourse,
    getInstructorCourses,
    deleteCourse
}