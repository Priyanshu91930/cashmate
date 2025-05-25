import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, School, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const storedData = localStorage.getItem('userData');
    const token = localStorage.getItem('token');
    
    if (!storedData || !token) {
      console.log('No user data or token found, redirecting to registration');
      navigate('/registration');
      return;
    }

    try {
      // Validate that storedData is valid JSON
      if (typeof storedData !== 'string' || !storedData.trim()) {
        throw new Error('Invalid user data format');
      }
      
      const parsedData = JSON.parse(storedData);
      
      // Validate the parsed data has required fields
      if (!parsedData || typeof parsedData !== 'object' || !parsedData.id) {
        throw new Error('User data is incomplete');
      }
      
      setUserData(parsedData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Clear invalid data from localStorage
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      setError('Your session has expired. Please log in again.');
      navigate('/login');
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-4xl mx-auto bg-white rounded-[32px] shadow-xl p-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Photo Section */}
          <div className="md:col-span-1">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
              {userData.photo?.data ? (
                <img
                  src={userData.photo.data}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <User size={64} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold text-gray-800">{userData.name}</h2>
              <p className="text-emerald-600 font-medium">{userData.studentId}</p>
            </div>
          </div>

          {/* User Information Section */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Student Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Mail className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Phone className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{userData.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <School className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium">{userData.course}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Users className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Section</p>
                  <p className="font-medium">{userData.section}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <School className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium">{userData.semester}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <User className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Father's Name</p>
                  <p className="font-medium">{userData.fatherName}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <FileText className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Card Status</p>
                  <p className="font-medium text-emerald-600">Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home; 