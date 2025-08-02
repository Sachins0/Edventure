const { StatusCodes } = require("http-status-codes");
const Category = require("../models/Category");
const { SuccessResponse, ErrorResponse } = require("../utils/common");


//create
const createCategory = async (req, res) => {
    try {
        //data req.body
        const {name, description} = req.body;
        //validate
        if(!name || !description){
            ErrorResponse.error = 'Validation Error';
            ErrorResponse.message = 'All fields are required';
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json(ErrorResponse)
        }
        //create entry in DB
        const categoryDetails = await Category.create({name, description});
        //return res
        SuccessResponse.message = 'Category is created successfully';
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = 'Error occurred while creating category';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

//getAllCategories
const showAllCategories = async (req, res) => {
    try {
        //find All
        const categories = await Category.find({});
        SuccessResponse.data = categories;
        SuccessResponse.message = 'All categories returned successfully';
            return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while showing categories';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}

//categoryPageDetails
const categoryPageDetails = async(req, res) => {
    try {
        //get categoryId
        const {categoryId} = req.body;
        //get courses for specified category
        const selectedCategory = await Category.findById(categoryId)
                                                .populate({
                                                    path: "course",
                                                    match: { status: "Published" },
                                                    populate:  [
                                                                {
                                                                    path: "ratingAndReviews",
                                                                },
                                                                {
                                                                    path: "instructor",
                                                                },
                                                                ],
                                                }) 
                                                .exec()                                       
        //validation
        if(!selectedCategory) {
            ErrorResponse.message = 'Category not found';
            return res
                    .status(StatusCodes.NOT_FOUND)
                    .json(ErrorResponse)
        }
        if(selectedCategory.course.length === 0) {
            ErrorResponse.message = 'No courses found for this category';
            return res
                    .status(StatusCodes.NOT_FOUND)
                    .json(ErrorResponse)
        }
        //get diff category courses
        const categoriesExceptSelected = await Category.find({_id: { $ne: categoryId }});
        function getRandomInt(max) {
            return Math.floor(Math.random() * max)
        };
        let differentCategory = [];
        if(categoriesExceptSelected.length !== 0) {
            differentCategory = await Category.findOne(
                                                    categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
                                                        ._id
                                                )
                                                .populate({
                                                    path: "course",
                                                    match: { status: "Published" },
                                                    populate:  [
                                                                {
                                                                    path: "ratingAndReviews",
                                                                },
                                                                {
                                                                    path: "instructor",
                                                                },
                                                                ],
                                                }) 
                                                .exec()
        }
        // get top selling courses
        const allCategories = await Category.find()
                                            .populate({
                                                    path: "course",
                                                    match: { status: "Published" },
                                                    populate:  [
                                                                {
                                                                    path: "ratingAndReviews",
                                                                },
                                                                {
                                                                    path: "instructor",
                                                                },
                                                                ],
                                                }) 
                                            .exec()
        const allCourses = allCategories.flatMap((category) => category.course)
        const mostSellingCourses = allCourses
                                        .sort((a, b) => b.sold - a.sold)
                                        .slice(0, 10)
        //return res
        SuccessResponse.data = {selectedCategory, differentCategory, mostSellingCourses};
        SuccessResponse.message = 'All categories courses returned successfully';
            return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching category details';
        return res
                .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};

module.exports = {
    createCategory,
    showAllCategories,
    categoryPageDetails
}