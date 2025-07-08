const { StatusCodes } = require("http-status-codes");
const Course = require("../models/Course");
const { ErrorResponse, mailSender } = require("../utils/common");
const { default: mongoose } = require("mongoose");
const instance = require("../config/razorpay-config");
const User = require("../models/User");
const serverConfig = require("../config/server-config");
const {paymentSuccessEmail, courseRegConf} = require('../mail/templates');
const CourseProgress = require("../models/CourseProgress");


//capture payment and initiate Razorpay order
const capturePayment = async(req, res) => {
    //get courseId and userId
    const {courses} = req.body;
    const userId = req.user.id;
    //validation
    if(courses.length === 0){
        ErrorResponse.message = 'Course id is not valid';
        return res
                .status(StatusCodes.BAD_REQUEST)
                .json(ErrorResponse)
    };

    let total_amount = 0
    //find valid course
    for(const course_id of courses){ 
        let course;
        try {
            course = await Course.findById(course_id);
            if(!course){
                ErrorResponse.message = 'no course found';
                return res
                        .status(StatusCodes.NOT_FOUND)
                        .json(ErrorResponse)
            }

            //user already paid for same course
            const uid = mongoose.Types.ObjectId(userId);
            if(course.studentEnrolled.includes(uid)){
                ErrorResponse.message = 'Already paid';
                return res
                        .status(StatusCodes.BAD_REQUEST)
                        .json(ErrorResponse);
            }
            // Add the price of the course to the total amount
            total_amount += course.price
        } catch (error) {
            ErrorResponse.error = error;
            ErrorResponse.message = ErrorResponse.message || 'Error occurred while fetching course details for payment';
            return res
                    .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                    .json(ErrorResponse);
        }
    }
    //create order
    const options = {
        amount : total_amount * 100,
        currency : 'INR',
        reciept : Math.random(Date.now()).toString()
    }
    try {
        //initiate payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        //return res
        SuccessResponse.data = paymentResponse;
        SuccessResponse.message = 'Payment initiated successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while initiating payment';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
};

//verify signature of razorpay and server
// verify the payment
const verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id
    const razorpay_payment_id = req.body?.razorpay_payment_id
    const razorpay_signature = req.body?.razorpay_signature
    const courses = req.body?.courses
  
    const userId = req.user.id
  
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courses ||
      !userId
    ) {
        ErrorResponse.message = 'Payment failed';
        return res
                .status(StatusCodes.BAD_REQUEST)
                .json(ErrorResponse)
    }
  
    let body = razorpay_order_id + "|" + razorpay_payment_id
  
    const expectedSignature = crypto
      .createHmac("sha256", serverConfig.razorpaySecret)
      .update(body.toString())
      .digest("hex")
  
    if (expectedSignature === razorpay_signature) {
      await enrollStudents(courses, userId, res)
      SuccessResponse.data = "";
        SuccessResponse.message = 'Payment verified successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    }
  
    ErrorResponse.message = 'Payment failed';
    return res
            .status(StatusCodes.BAD_REQUEST)
            .json(ErrorResponse)
}
  
  // Send Payment Success Email
const sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body

    const userId = req.user.id

    if (!orderId || !paymentId || !amount || !userId) {
        ErrorResponse.message = 'Please provide all required fields';
        return res
                .status(StatusCodes.BAD_REQUEST)
                .json(ErrorResponse)
    }

    try {
        const enrolledStudent = await User.findById(userId)

        await mailSender(
        enrolledStudent.email,
        `Payment Received`,
        paymentSuccessEmail(
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
            amount / 100,
            orderId,
            paymentId
        )
        )
    } catch (error) {
        ErrorResponse.error = error;
        ErrorResponse.message = ErrorResponse.message || 'Error occurred while sending payment success email';
        return res
                .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
    }
}
  
  // enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
        ErrorResponse.message = 'Please provide all required fields';
        return res
                .status(StatusCodes.BAD_REQUEST)
                .json(ErrorResponse)
    }

    for (const courseId of courses) {
        try {
        // Find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
            { _id: courseId },
            { $push: { studentEnrolled: userId } },
            { new: true }
        )

        if (!enrolledCourse) {
            ErrorResponse.message = 'Course not found';
            return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json(ErrorResponse)
        }
        console.log("Updated course: ", enrolledCourse)

        const courseProgress = await CourseProgress.create({
            courseID: courseId,
            userId: userId,
            completedVideos: [],
        })
        // Find the student and add the course to their list of enrolled courses
        const enrolledStudent = await User.findByIdAndUpdate(
            userId,
            {
            $push: {
                courses: courseId,
                courseProgress: courseProgress._id,
            },
            },
            { new: true }
        )

        console.log("Enrolled student: ", enrolledStudent)
        // Send an email notification to the enrolled student
        const emailResponse = await mailSender(
            enrolledStudent.email,
            `Successfully Enrolled into ${enrolledCourse.courseName}`,
            courseRegConf(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
            )
        )

        console.log("Email sent successfully: ", emailResponse.response)
        } catch (error) {
            ErrorResponse.error = error;
            ErrorResponse.message = ErrorResponse.message || 'Error occurred while enrolling students';
            return res
                    .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
                    .json(ErrorResponse);
        }
    }
}

module.exports = {
    capturePayment,
    verifyPayment,
    sendPaymentSuccessEmail,
    enrollStudents
}