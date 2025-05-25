import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useUser, SignOutButton } from '@clerk/clerk-react';
import Splash from './splash/Splash';
import Homepage from './homepage/Homepage';
import Radar from './homepage/Radar';
import ChatPage from './chat/ChatPage';
import UserDataForm from './registrations/UserDataForm';
import axios from 'axios';
import axiosInstance from './axiosInstance';
import { useAuth } from '@clerk/clerk-react';

const ProtectedRoute = ({ children, requireProfileCompletion = true }) => {
  const { isSignedIn, isLoaded, user } = useUser();
  const [userStatus, setUserStatus] = useState({
    loading: true,
    isRegistered: false,
    isProfileComplete: false,
    error: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRegistration = async () => {
      if (isSignedIn && isLoaded && user) {
        try {
          // Get the first email and phone from Clerk user
          const clerkEmail = user.emailAddresses[0]?.emailAddress;
          const clerkPhone = user.phoneNumbers[0]?.phoneNumber;

          if (!clerkEmail || !clerkPhone) {
            throw new Error('Email and phone number are required');
          }

          // Check if user exists in MongoDB
          const response = await axiosInstance.post('/api/clerk-auth/check-user', {
            clerkUserId: user.id,
            email: clerkEmail,
            phone: clerkPhone
          });

          console.log('User check response:', response.data);

          if (response.data.success) {
            const userData = response.data.user;
            // Store user data in localStorage
            localStorage.setItem('userData', JSON.stringify(userData));
            
            setUserStatus({
              loading: false,
              isRegistered: true,
              isProfileComplete: userData.registrationStatus === 'complete',
              error: null
            });
          } else {
            setUserStatus({
              loading: false,
              isRegistered: false,
              isProfileComplete: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Error checking user registration:', error);
          setUserStatus({
            loading: false,
            isRegistered: false,
            isProfileComplete: false,
            error: error.message
          });
        }
      }
    };

    checkUserRegistration();
  }, [isSignedIn, isLoaded, user]);

  if (!isLoaded || userStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (userStatus.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          Error: {userStatus.error}
        </div>
      </div>
    );
  }

  // If profile completion is required and user is not registered or profile is not complete
  if (requireProfileCompletion && (!userStatus.isRegistered || !userStatus.isProfileComplete)) {
    return <Navigate to="/user-data-form" replace />;
  }

  return children;
};

const App = () => {
  const { isSignedIn } = useUser();

  return (
    <Router>
      {isSignedIn && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <SignOutButton />
        </div>
      )}
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route 
          path="/sign-in" 
          element={<SignIn routing="path" path="/sign-in" />} 
        />
        <Route 
          path="/sign-up" 
          element={<SignUp routing="path" path="/sign-up" />} 
        />
        
        <Route 
          path="/user-data-form" 
          element={
            <ProtectedRoute requireProfileCompletion={false}>
              <UserDataForm />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/radar" 
          element={
            <ProtectedRoute>
              <Radar />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat/:studentId" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
