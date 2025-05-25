import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { SignInButton, SignUpButton, SignOutButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

const Splash = () => {
  const { isSignedIn, isLoaded, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (isSignedIn && isLoaded && user) {
        try {
          const response = await axiosInstance.post('/api/clerk-auth/check-user', {
            clerkUserId: user.id,
            email: user.emailAddresses[0].emailAddress,
            name: user.fullName,
            phone: user.phoneNumbers[0]?.phoneNumber
          });

          // If profile is not complete, redirect to user data form
          if (!response.data.isProfileComplete) {
            navigate('/user-data-form');
          } else {
            // If profile is complete, redirect to home
            navigate('/home');
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          
          // Log detailed error information
          if (error.response) {
            // The request was made and the server responded with a status code
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
          }

          // Fallback to user data form if there's an error
          navigate('/user-data-form');
        }
      }
    };

    checkUserStatus();
  }, [isSignedIn, isLoaded, user, navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.2
        }}
        className="flex flex-col items-center justify-center max-w-sm bg-white rounded-[40px] overflow-hidden p-8 shadow-xl"
      >
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-800 text-3xl font-bold leading-tight text-center"
        >
          Experience the{' '}
          <span className="text-emerald-600 bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
            easier way
          </span>
          <br />for transactions!
        </motion.h1>

        <motion.p 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-gray-600 text-lg font-normal text-center"
        >
          Connect your money to your friends.
        </motion.p>

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-8"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-40 h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center shadow-lg"
          >
            <img src="/images/1.png" alt="Placeholder" className="w-32 h-32 object-contain" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-col space-y-4 w-full"
        >
          {!isSignedIn ? (
            <>
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-emerald-600 text-white rounded-full font-medium shadow-lg hover:bg-emerald-700 transition-colors"
                >
                  Get Started
                </motion.button>
              </SignUpButton>
              
              <SignInButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-white text-emerald-600 border-2 border-emerald-600 rounded-full font-medium shadow-md hover:bg-emerald-50 transition-colors"
                >
                  Login
                </motion.button>
              </SignInButton>
            </>
          ) : (
            <SignOutButton>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 px-6 bg-red-600 text-white rounded-full font-medium shadow-lg hover:bg-red-700 transition-colors"
              >
                Sign Out (Test Purpose)
              </motion.button>
            </SignOutButton>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-sm text-gray-500 text-center"
        >
          Fast, Secure & Easy to Use
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default Splash;
