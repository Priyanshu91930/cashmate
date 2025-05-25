import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, User, Mail, School, Users, FileText, AlertTriangle, Loader2, ShieldAlert, X, Phone, Check, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import axiosInstance from '../axiosInstance'; // Import the configured axios instance
import { useUser } from '@clerk/clerk-react'; // Import useUser from Clerk

// Set worker path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLib.version === '3.11.174' 
  ? 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  : `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Add this function before the UserDataForm component
const loadPdfJs = async () => {
  if (!pdfjsLib.getDocument || !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    throw new Error('PDF.js not properly loaded');
  }
};

const UserDataForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser(); // Get user from Clerk
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: location.state?.phone || '',
    course: '',
    section: '',
    semester: '',
    fatherName: '',
    idCard: null
  });

  const [pdfValidation, setPdfValidation] = useState({
    isValidating: false,
    isValid: false,
    error: null,
    matchedFields: []
  });

  const [passwordError, setPasswordError] = useState('');

  // Add useEffect to initialize PDF.js
  useEffect(() => {
    loadPdfJs().catch(error => {
      console.error('Error initializing PDF.js:', error);
    });
  }, []);

  // Effect to fetch user data and pre-fill form fields
  useEffect(() => {
    const initializeForm = async () => {
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

          if (response.data.success) {
            const userData = response.data.user;
            // If user exists and registration is complete, redirect to home
            if (userData.registrationStatus === 'complete') {
              navigate('/home');
              return;
            }
            // Pre-fill form with existing data
            setFormData(prevData => ({
              ...prevData,
              name: userData.name || user.fullName || '',
              email: userData.email || clerkEmail,
              phone: userData.phone || clerkPhone,
              course: userData.course || '',
              section: userData.section || '',
              semester: userData.semester || '',
              fatherName: userData.fatherName || ''
            }));
          } else {
            // New user - set only Clerk data
            setFormData(prevData => ({
              ...prevData,
              name: user.fullName || '',
              email: clerkEmail,
              phone: clerkPhone
            }));
          }
        } catch (error) {
          console.error('Error initializing form:', error);
          setError(error.message);
        }
      }
    };

    initializeForm();
  }, [isSignedIn, isLoaded, user, navigate]);

  // Debug logging
  useEffect(() => {
    console.log('Location state:', location.state);
    console.log('Form data:', formData);
  }, [location.state, formData]);

  // Show warning when user starts interacting with the form
  useEffect(() => {
    if (!hasInteracted && Object.values(formData).some(value => value)) {
      setHasInteracted(true);
      setShowWarning(true);
    }
  }, [formData, hasInteracted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let pdfUrl = '';
      if (formData.idCard) {
        // Upload PDF first
        const pdfFormData = new FormData();
        pdfFormData.append('pdf', formData.idCard);
        
        try {
          const pdfResponse = await axiosInstance.post('/api/clerk-auth/upload-pdf', pdfFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Accept': 'application/json'
            }
          });
          
          if (pdfResponse.data.success) {
            pdfUrl = pdfResponse.data.pdfUrl;
          } else {
            throw new Error(pdfResponse.data.message || 'Failed to upload ID card');
          }
        } catch (pdfError) {
          console.error('Error uploading PDF:', pdfError);
          if (pdfError.response) {
            setError(pdfError.response.data?.message || 'Failed to upload ID card. Please try again.');
          } else {
            setError('Failed to upload ID card. Please try again.');
          }
          setLoading(false);
          return;
        }
      }

      // Prepare the profile data
      const profileData = {
        clerkUserId: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone.startsWith('+91') 
          ? formData.phone.replace(/\s/g, '')
          : `+91${formData.phone.replace(/\s/g, '')}`,
        course: formData.course,
        section: formData.section,
        semester: formData.semester,
        fatherName: formData.fatherName,
        pdf: pdfUrl,
        password: formData.password
      };

      // Complete the profile
      const response = await axiosInstance.post('/api/clerk-auth/complete-profile', profileData);

      if (response.data.success) {
        // Store user data in localStorage
        const userData = {
          ...response.data.user,
          pdf: pdfUrl,
          registrationStatus: 'complete'
        };
        localStorage.setItem('userData', JSON.stringify(userData));

        // Navigate to homepage
        navigate('/home');
      } else {
        throw new Error(response.data.message || 'Failed to complete profile');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred while submitting the form');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4"
    >
      {/* Enhanced Warning Banner */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-4 shadow-lg">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={24} className="text-red-200" />
                  <div>
                    <h3 className="font-semibold text-lg">Important Notice</h3>
                    <p className="text-sm text-red-100">
                      Providing incorrect information may result in a 31-day ban from the service.
                      Please ensure all details match your ID card exactly.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowWarning(false)}
                  className="text-red-200 hover:text-white transition-colors duration-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl mx-auto bg-white rounded-[32px] shadow-xl p-6 mt-12"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
          <p className="text-gray-600 mt-2 text-sm">Please provide accurate information that matches your ID card</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600"
          >
            <AlertTriangle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        {passwordError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600"
          >
            <AlertTriangle size={20} />
            <span>{passwordError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  readOnly
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-emerald-500 rounded-xl text-gray-600 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check size={14} className="text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Shield size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Shield size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.phone}
                  readOnly
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-emerald-500 rounded-xl text-gray-600 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check size={14} className="text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <div className="relative">
                <School size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
                  placeholder="Enter your course"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <div className="relative">
                <Users size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
                  placeholder="Enter your section"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <div className="relative">
                <School size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  required
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="">Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
                  placeholder="Enter father's name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">University ID Card (PDF)</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => handleInputChange('idCard', e.target.files[0])}
                  className="hidden"
                  id="id-card"
                />
                <label
                  htmlFor="id-card"
                  className={`flex items-center gap-2 w-full pl-4 pr-4 py-3 bg-gray-50 border-2 ${
                    formData.idCard ? 'border-emerald-500' : 'border-gray-200'
                  } rounded-xl cursor-pointer hover:bg-gray-100 transition-colors duration-300`}
                >
                  <FileText size={20} className={formData.idCard ? 'text-emerald-500' : 'text-gray-400'} />
                  <span className={formData.idCard ? 'text-emerald-600' : 'text-gray-500'}>
                    {formData.idCard ? formData.idCard.name : 'Upload University ID Card'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl text-white text-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Upload size={20} />
                <span>Submit Information</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UserDataForm; 