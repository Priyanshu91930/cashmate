import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, School, Users, FileText, Camera, Edit2, Save, X, AlertCircle } from 'lucide-react';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
          setEditedData(parsedData);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('userId', userData._id);

        const response = await fetch('http://localhost:3002/api/users/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload photo');
        }

        const data = await response.json();
        const updatedUserData = {
          ...userData,
          photo: data.photoUrl
        };
        setUserData(updatedUserData);
        setEditedData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      } catch (err) {
        setError('Failed to upload photo');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      const response = await fetch(`http://localhost:3002/api/users/${userData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      if (!result.user) throw new Error('Invalid response from server');
      setUserData(result.user);
      localStorage.setItem('userData', JSON.stringify(result.user));
      setSaveStatus('success');
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('error');
      setError(err.message);
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 3000);
    }
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const renderEditableField = (label, key, Icon) => {
    const isReadOnly = key === 'email' || key === 'phone';
    return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
        <Icon className="text-emerald-600" />
      </div>
        <div>
        <p className="text-sm text-gray-500">{label}</p>
        {isEditing ? (
          <input
              type={key === 'email' ? 'email' : 'text'}
              value={editedData[key]}
              onChange={e => handleInputChange(key, e.target.value)}
              className="font-medium bg-transparent border-b border-gray-300 focus:border-emerald-500 focus:ring-0 outline-none"
              readOnly={isReadOnly}
              style={isReadOnly ? { color: '#888', background: '#f9fafb', cursor: 'not-allowed' } : {}}
          />
        ) : (
            <p className="font-medium">{userData[key]}</p>
        )}
      </div>
    </div>
  );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center text-gray-500">
        No user data found
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      {/* Save Status Alert */}
      {saveStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            saveStatus === 'saving' ? 'bg-blue-100 text-blue-700' :
            saveStatus === 'success' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}
        >
          {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>}
          {saveStatus === 'success' && <CheckCircle size={20} />}
          {saveStatus === 'error' && <AlertCircle size={20} />}
          <span>
            {saveStatus === 'saving' && 'Saving changes...'}
            {saveStatus === 'success' && 'Profile updated successfully!'}
            {saveStatus === 'error' && 'Failed to update profile'}
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Photo Section */}
        <div className="md:col-span-1">
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group">
            {userData.photo ? (
              <img
                src={userData.photo}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <User size={64} className="text-gray-400" />
              </div>
            )}
            <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Camera size={32} className="text-white" />
            </label>
          </div>
          <div className="mt-4 text-center">
            {isEditing ? (
              <input
                type="text"
                value={editedData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-2xl font-bold text-gray-800 text-center bg-transparent border-b border-gray-300 focus:border-emerald-500 focus:ring-0 outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-800">{userData.name}</h2>
            )}
            <div className="mt-1">
              <span className="text-sm text-gray-500">Student ID:</span>
              <span className="ml-1 text-sm text-gray-800">{userData.studentId}</span>
            </div>
          </div>
        </div>

        {/* User Information Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Student Information</h3>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Save size={18} />
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-300"
                  >
                    <X size={18} />
                    Cancel
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </motion.button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderEditableField('Email', 'email', Mail)}
            {renderEditableField('Phone', 'phone', Phone)}
            {renderEditableField('Course', 'course', School)}
            {renderEditableField('Section', 'section', Users)}
            {renderEditableField('Semester', 'semester', School)}
            {renderEditableField("Father's Name", 'fatherName', User)}
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
  );
};

export default Profile; 