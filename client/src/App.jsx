import React from 'react'
import {Route, Routes, useNavigate} from 'react-router-dom'
import Home from './page/Home'
import './App.css'
import Navbar from './components/common/Navbar'
import About from './page/About'
import Contact from './page/Contact'
import Catalog from './page/Catalog'
import OpenRoute from './components/core/auth/OpenRoute'
import Login from './page/Login'
import Signup from './page/Signup'
import VerifyEmail from './page/VerifyEmail'
import ForgotPassword from './page/ForgotPassword'
import UpdatePassword from './page/UpdatePassword'
import Dashboard from './page/Dashboard'
import MyProfile from './components/core/dashboard/MyProfile'
import PrivateRoute from './components/core/auth/PrivateRoute'
import Settings from './components/core/dashboard/settings'
import { useDispatch, useSelector } from 'react-redux'
import { ACCOUNT_TYPE } from './utils/constants'
import Cart from './components/core/dashboard/cart'
import EnrolledCourses from './components/core/dashboard/EnrolledCourses'
import CourseDetails from './page/CourseDetails'

function App() {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.profile)

  return (
    <div className='w-screen min-h-screen bg-richblack-900 flex flex-col font-inter'>
      <Navbar/>
      <Routes>
        <Route path='/' element= {<Home/>} />
        <Route path="/about" element={ <About />}/>
        <Route path="/contact" element={ <Contact />}/>
        <Route path="catalog/:catalogName" element={<Catalog/>} />
        <Route path="courses/:courseId" element={<CourseDetails/>} />
        <Route
          path="signup"
          element={
            <OpenRoute>
              <Signup />
            </OpenRoute>
          }
        />
      <Route
            path="login"
            element={
              <OpenRoute>
                <Login />
              </OpenRoute>
            }
          />
        <Route
          path="verify-email"
          element={
            <OpenRoute>
              <VerifyEmail />
            </OpenRoute>
          }
        />
        <Route
          path="forgot-password"
          element={
            <OpenRoute>
              <ForgotPassword />
            </OpenRoute>
          }
        />
        <Route
          path="update-password/:id"
          element={
            <OpenRoute>
              <UpdatePassword />
            </OpenRoute>
          }
        />
        <Route 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
        <Route path="dashboard/my-profile" element={<MyProfile />} />
        <Route path="dashboard/Settings" element={<Settings />} />

        {
        user?.accountType === ACCOUNT_TYPE.STUDENT && (
          <>
          <Route path="dashboard/cart" element={<Cart />} />
          <Route path="dashboard/enrolled-courses" element={<EnrolledCourses />} />
          </>
        )
      }
        </Route>
      </Routes>
    </div>
  )
}

export default App