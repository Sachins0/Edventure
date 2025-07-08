const { StatusCodes } = require("http-status-codes");
const Section = require("../models/Section");
const { ErrorResponse, SuccessResponse, uploadImageToCloudinary } = require("../utils/common");
const SubSection = require("../models/SubSection");
const serverConfig = require("../config/server-config");


//create subSection
const createSubSection = async (req, res) => {
   try {
        //data fetch
        const {title, description, sectionId} = req.body;
        //video req.file
        const video = req.files.video;
        //validation
        if([title, description, sectionId].some(field => field?.trim() === '')){
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //upload video to cloudinary
        const videoFile = await uploadImageToCloudinary(video, serverConfig.folderName);
        //create subSection
        const newSubSection = await SubSection.create({title, timeDuration: videoFile.duration, description, videoUrl : videoFile.secure_url});
        //push into section
        const updatedSectionDetails = await Section.findByIdAndUpdate(
            {_id : sectionId},
            {
                $push : {
                    subSection : newSubSection._id
                }
            },
            {new : true}
        ).populate('subSection');
        //return res
        SuccessResponse.data = updatedSectionDetails;
        SuccessResponse.message = 'SubSection is created successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
   } catch (error) {
    ErrorResponse.error = error;
    ErrorResponse.message = 'Error occurred while creating subSection';
    return res
            .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
   }
};

//update
const updateSubSection = async (req, res) => {
    try {
        //data fetch
        const { sectionId, subSectionId, title, description } = req.body
        const subSection = await SubSection.findById(subSectionId)
        //validation
        if(!subSection){
            ErrorResponse.message = 'SubSection not found';
            return res
                    .status(StatusCodes.NOT_FOUND)
                    .json(ErrorResponse)
        }
        //update
        if (title !== undefined) {
            subSection.title = title
        }
      
        if (description !== undefined) {
            subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
                video,
                serverConfig.folderName
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }
    
        await subSection.save();
        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate("subSection");
        //return res
        SuccessResponse.data = updatedSection;
        SuccessResponse.message = 'SubSection is updated successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while updating subSection';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};

//delete
const deleteSubSection = async (req, res) => {
    try {
         //data fetch
         const {subSectionId, sectionId} = req.params;
         //validation
         if(!subSectionId){
             ErrorResponse.message = 'All fields are required';
             return res
                     .status(StatusCodes.BAD_REQUEST)
                     .json(ErrorResponse)
         }
         await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
              $pull: {
                subSection: subSectionId,
              },
            }
          )
         //delete
         await SubSection.findByIdAndDelete(subSectionId);
         const updatedSection = await Section.findById(sectionId).populate("subSection")
         //return res
         SuccessResponse.message = 'SubSection is deleted successfully';
         SuccessResponse.data = updatedSection;
         return res
                 .status(StatusCodes.OK)
                 .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while deleting subSection';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

module.exports = {
    createSubSection,
    updateSubSection,
    deleteSubSection
}