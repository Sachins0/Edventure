# [Edventure: An Ed-Tech Platform](https://edventure-client.vercel.app/)

[Project Description](https://docs.google.com/document/d/15NK_rge-MgKoMpZ66oODDJHOWl577_MI4QV1UdHPcc0/edit?usp=sharing)

Edventure is a full-featured ed-tech platform that enables users to **create, consume, and rate educational content**. The platform is built using the **MERN stack** (MongoDB, ExpressJS, ReactJS, NodeJS) and aims to make learning **engaging, accessible, and interactive** for students while providing instructors with powerful tools to connect and share their expertise.

## 🚀 Features

### For Students
- Browse and search all available courses
- Add courses to a wishlist
- Purchase and enroll in courses (Razorpay integration)
- Access course content (videos, documents, etc.)
- Rate and review courses
- Manage and edit user account

### For Instructors
- Dashboard with course overviews, feedback, and ratings
- View insights and analytics on courses
- Create, update, and delete courses with media upload (Cloudinary integration)
- Manage profile and edit instructor details

### (Planned) For Admins
- Platform-wide dashboard and metrics
- Instructor and user management

## 🛠️ Tech Stack

| Layer       | Technology                                   |
|-------------|----------------------------------------------|
| Frontend    | ReactJS, Redux, CSS, Tailwind                |
| Backend     | NodeJS, ExpressJS                            |
| Database    | MongoDB, Mongoose                            |
| Auth        | JWT, Bcrypt                                  |
| Media Mgt   | Cloudinary                                   |
| Deployment  | Vercel (frontend), Render/Railway (backend), MongoDB Atlas |

## 👷🏻‍♀️ Architecture Diagram
- Here is a high-level diagram that illustrates the architecture of the Edventure ed-tech platform:
  ![alt text](client\src\assets\Images\hld.png)

## 🗐 [Data Models and Database Schema](https://app.eraser.io/workspace/1s64UdKJwi9Zr4Kxx9oN?origin=share):
  ![alt text](client\src\assets\Images\model.png)



## 🏗️ System Architecture

- **Client-Server architecture**: ReactJS frontend communicates with the NodeJS/ExpressJS backend via RESTful APIs.
- **Monolithic backend**: All the logic and routes are managed in a single ExpressJS server connected to MongoDB.
- **Media & Document Handling**: Course content is stored in Markdown for easy rendering; all media files are offloaded to Cloudinary.

## 📋 API Overview

RESTful API endpoints (NodeJS/ExpressJS) with JSON payloads:

| Endpoint                              | Description                        |
|----------------------------------------|------------------------------------|
| `POST /api/auth/signup`                | User registration (student/instructor) |
| `POST /api/auth/login`                 | User login & JWT token issuance    |
| `POST /api/auth/verify-otp`            | OTP verification                   |
| `POST /api/auth/forgot-password`       | Forgot password flow               |
| `GET /api/courses`                     | List all courses                   |
| `GET /api/courses/:id`                 | View single course details         |
| `POST /api/courses`                    | Instructor creates a new course    |
| `PUT /api/courses/:id`                 | Update existing course             |
| `DELETE /api/courses/:id`              | Delete course                      |
| `POST /api/courses/:id/rate`           | Student adds a rating              |

## ⭐ Project Highlights

- **Secure user authentication** with JWT and password hashing (Bcrypt)
- **Responsive user interfaces** with ReactJS, Tailwind CSS, and Redux for state management
- **Course media uploads** stored securely on Cloudinary
- **Flexible NoSQL database** with MongoDB/Mongoose for storing and querying users, courses, and media
- **Modern deployment pipeline** using Vercel (frontend), Render/Railway.app (backend), and managed MongoDB Atlas

## 🚀 Deployment

- **Frontend**: Vercel (React build)
- **Backend**: Render/Railway (NodeJS/ExpressJS)
- **Media Storage**: Cloudinary
- **Database**: MongoDB Atlas (cloud-managed)

## 🧪 Testing

- Unit, integration, and end-to-end testing (frameworks/tools as per implementation, e.g., Jest, Cypress, etc.)

## 🔮 Future Enhancements

- **Personalized learning paths** based on interests and styles (High priority)
- **Mobile App** for expanded accessibility (High priority)
- **Gamification** (badges, leaderboards, points)
- **Social learning** (group discussions, peer feedback, collaborative projects)
- **ML-powered recommendations** for course discovery
- **VR/AR integration** for immersive learning experiences


## 👨💻 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change or add.

## 📫 Contact

For any queries or feedback, reach out to the project maintainer:

- **Name:** Sachin Singh

> Edventure is built to empower lifelong learning — for everyone, everywhere.
