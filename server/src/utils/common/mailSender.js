const nodemailer = require('nodemailer');
const { ServerConfig } = require('../../config');

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            host: ServerConfig.mailHost,
            auth: {
                user: ServerConfig.mailUser,
                pass: ServerConfig.password
            }
        });

        let info = await transporter.sendMail({
            from: 'Edventure || By Sachin',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });
        return info;
    } catch (error) {
        throw new Error(`Mail sending failed: ${error.message}`);
    }
};

module.exports = mailSender;