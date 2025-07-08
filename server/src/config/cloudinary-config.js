const serverConfig = require("./server-config");

const cloudinary = require("cloudinary").v2; 

const cloudinaryConnect = () => {
	try {
		cloudinary.config({
			cloud_name: serverConfig.cloudinaryName,
			api_key: serverConfig.cloudinaryKey,
			api_secret: serverConfig.cloudinarySecret,
		});
	} catch (error) {
		console.log(error);
	}
};

module.exports = {cloudinaryConnect};