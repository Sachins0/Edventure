const { StatusCodes } = require("http-status-codes");
const Course = require("../models/Course");
const Section = require("../models/Section");
const { ErrorResponse, SuccessResponse } = require("../utils/common");
const SubSection = require("../models/SubSection");


//create section
const createSection = async (req, res) => {
   try {
        //data fetch
        const {sectionName, courseId} = req.body;
        //validation
        if(!sectionName || !courseId){
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //create section
        const newSection = await Section.create({sectionName});
        //push into course
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            {_id : courseId},
            {
                $push : {
                    courseContent : newSection._id
                }
            },
            {new : true}
        )
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec();
        //return res
        SuccessResponse.data = updatedCourseDetails;
        SuccessResponse.message = 'Section is created successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
   } catch (error) {
    ErrorResponse.error = error;
    ErrorResponse.message = ErrorResponse.message || 'Error occurred while creating section';
    return res
            .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
   }
};

//update
const updateSection = async (req, res) => {
    try {
        //data fetch
        const {sectionId, newSectionName, courseId} = req.body;
        //validation
        if(!newSectionName || !sectionId){
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //update
        const newSection = await Section.findByIdAndUpdate(sectionId, {newSectionName}, {new : true})
        const course = await Course.findById(courseId)
		.populate({
			path:"courseContent",
			populate:{
				path:"subSection",
			},
		})
		.exec();
        //return res
        SuccessResponse.data = course;
        SuccessResponse.message = 'Section is updated successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while updating section';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};

//delete
const deleteSection = async (req, res) => {
    try {
         //data fetch
         const {sectionId, courseId} = req.params;
         //validation
         if(!sectionId){
             ErrorResponse.message = 'All fields are required';
             return res
                     .status(StatusCodes.BAD_REQUEST)
                     .json(ErrorResponse)
         }
         //delete
         await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
        const section = await Section.findById(sectionId);
         await Section.findByIdAndDelete(sectionId);
         if(!section) {
			ErrorResponse.message = 'Section not found';
             return res
                     .status(StatusCodes.BAD_REQUEST)
                     .json(ErrorResponse)
		}
        await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);
        //find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();
         //return res
         SuccessResponse.message = 'Section is deleted successfully';
         SuccessResponse.data = course;
         return res
                 .status(StatusCodes.OK)
                 .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while deleting section';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

module.exports = {
    createSection,
    updateSection,
    deleteSection
}