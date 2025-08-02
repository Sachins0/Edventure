const { StatusCodes } = require("http-status-codes")
const CourseProgress = require("../models/CourseProgress")
const SubSection = require("../models/SubSection")
const { ErrorResponse, SuccessResponse } = require("../utils/common")

const updateCourseProgress = async (req, res) => {
    const { courseId, subsectionId } = req.body
    const userId = req.user.id
  
    try {
      // Check if the subsection is valid
      const subsection = await SubSection.findById(subsectionId)
      if (!subsection) {
        ErrorResponse.message = 'Invalid subsection';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
      }
  
      // Find the course progress document for the user and course
      let courseProgress = await CourseProgress.findOne({
        courseId: courseId,
        userId: userId,
      })
  
      if (!courseProgress) {
        // If course progress doesn't exist, create a new one
        courseProgress = await CourseProgress.create({
          courseId: courseId,
          userId: userId,
          completedVideos: [subsectionId], // Initialize with the current subsection
        })
      } else {
        // If course progress exists, check if the subsection is already completed
        if (courseProgress.completedVideos.includes(subsectionId)) {
          ErrorResponse.message = 'Subsection already completed';
          return res
                  .status(StatusCodes.BAD_REQUEST)
                  .json(ErrorResponse)
        }
  
        // Push the subsection into the completedVideos array
        courseProgress.completedVideos.push(subsectionId)
      }
  
      // Save the updated course progress
      await courseProgress.save()
  
      SuccessResponse.data = "";
    SuccessResponse.message = 'Course progress updated successfully';
    return res
            .status(StatusCodes.OK)
            .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while updating course progress';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

module.exports = updateCourseProgress;