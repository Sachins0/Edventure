const express = require("express");
const app = express();

const userRoutes = require("./routes/user-routes");
const profileRoutes = require("./routes/profile-routes");
const paymentRoutes = require("./routes/payment-routes");
const courseRoutes = require("./routes/course-routes");
const contactUsRoute = require("./routes/contact-routes");
const {DatabaseConfig, CloudinaryConfig, ServerConfig} = require("./config");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const PORT = ServerConfig.port || 4000;

//database connect
DatabaseConfig.connect();
//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin:"https://edventure-client.vercel.app",
		credentials:true,
	})
)

app.use(
	fileUpload({
		useTempFiles:true,
		tempFileDir:"/tmp",
	})
)
//cloudinary connection
CloudinaryConfig.cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

//def route

app.get("/", (req, res) => {
	return res.json({
		success:true,
		message:'Your server is up and running....'
	});
});

app.listen(PORT, () => {
	console.log(`App is running at ${PORT}`)
})

