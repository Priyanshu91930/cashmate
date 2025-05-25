const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    console.log('File filter called for:', file.originalname, 'mimetype:', file.mimetype);
    if (file.fieldname === 'profilePhoto') {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image file (jpg, jpeg, or png)'), false);
        }
    } else if (file.fieldname === 'pdf') {
        // Accept PDFs only
        if (!file.mimetype.includes('pdf')) {
            return cb(new Error('Please upload a PDF file'), false);
        }
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Create or update user profile
router.post('/profile', upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            course,
            section,
            semester,
            fatherName,
            password
        } = req.body;

        // Check if user already exists
        let user = await User.findOne({ phone });

        if (user) {
            // Update existing user
            const updateData = {
                name: fullName,
                email,
                course,
                section,
                semester,
                fatherName
            };

            // Only update password if provided
            if (password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }

            // Update profile photo if provided
            if (req.files && req.files.profilePhoto) {
                updateData.profilePhoto = req.files.profilePhoto[0].path;
            }

            // Update PDF if provided
            if (req.files && req.files.pdf) {
                updateData.pdf = req.files.pdf[0].path;
            }

            user = await User.findOneAndUpdate(
                { phone },
                updateData,
                { new: true }
            );
        } else {
            // Create new user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                name: fullName,
                email,
                phone,
                password: hashedPassword,
                course,
                section,
                semester,
                fatherName,
                profilePhoto: req.files && req.files.profilePhoto ? req.files.profilePhoto[0].path : '',
                pdf: req.files && req.files.pdf ? req.files.pdf[0].path : ''
            });

            await user.save();
        }

        res.json({
            success: true,
            message: 'Profile saved successfully',
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                course: user.course,
                section: user.section,
                semester: user.semester,
                fatherName: user.fatherName,
                profilePhoto: user.profilePhoto,
                pdf: user.pdf
            }
        });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving profile',
            error: error.message
        });
    }
});

// Get user profile
router.get('/profile/:phone', async (req, res) => {
    try {
        const user = await User.findOne({ phone: req.params.phone });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                course: user.course,
                section: user.section,
                semester: user.semester,
                fatherName: user.fatherName,
                profilePhoto: user.profilePhoto,
                universityIdCard: user.universityIdCard
            }
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update user profile
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Remove sensitive fields from update
        delete updateData.password;
        delete updateData._id;
        delete updateData.studentId;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Upload profile photo
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No photo uploaded'
            });
        }

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Delete old photo if exists
        const user = await User.findById(userId);
        if (user && user.profilePhoto) {
            const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Update user with new photo path
        const photoUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePhoto: photoUrl },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            photoUrl,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading photo',
            error: error.message
        });
    }
});

// Upload PDF file
router.post('/upload-pdf', (req, res, next) => {
    console.log('Upload PDF route hit');
    upload.single('pdf')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('Processing PDF upload:', req.file);
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded'
            });
        }

        // Create URL for the uploaded PDF
        const pdfUrl = `/uploads/${req.file.filename}`;
        console.log('PDF uploaded successfully:', pdfUrl);

        res.json({
            success: true,
            message: 'PDF uploaded successfully',
            pdfUrl
        });
    } catch (error) {
        console.error('Error in PDF upload route:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading PDF',
            error: error.message
        });
    }
});

module.exports = router; 