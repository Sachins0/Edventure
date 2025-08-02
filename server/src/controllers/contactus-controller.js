const { StatusCodes } = require("http-status-codes")
const { contactFormConf } = require("../mail/templates")
const mailSender = require("../utils/common")
const { SuccessResponse, ErrorResponse } = require("../utils/common")

const contactUsController = async (req, res) => {
  const { email, firstname, lastname, message, phoneNo } = req.body
  try {
    const emailRes = await mailSender(
      email,
      "Your Data send successfully",
      contactFormConf(email, firstname, lastname, message, phoneNo)
    )
    SuccessResponse.data = "";
    SuccessResponse.message = 'Email sent successfully';
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    ErrorResponse.message = ErrorResponse.message || 'Error occurred while sending email';
    return res
            .status(error.StatusCodes || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
  }
}

module.exports = contactUsController;