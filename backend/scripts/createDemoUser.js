require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const updateDemoUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_connect', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Create a new hash for password "123456"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        console.log('New password hash:', hashedPassword);

        // Generate a student ID
        const studentId = 'ST' + new Date().getFullYear() + String(Math.floor(Math.random() * 1000)).padStart(3, '0');

        // Update or create demo user
        const demoUser = {
            name: "priya",
            email: "priya@gmail.com",
            phone: "+919193345922",
            password: hashedPassword,
            studentId: studentId,
            profilePhoto: "uploads/profilePhoto-1745340493820-661713271.jpg",
            pdf: "uploads/pdf-1745340493824-977902480.pdf",
            course: "mca",
            section: "d",
            semester: "2",
            fatherName: "gs",
            isActive: false,
            connections: [],
            isOnline: true,
            lastSeen: new Date(),
            location: {
                type: "Point",
                coordinates: [0, 0]
            }
        };

        // First, try to find the existing user
        const existingUser = await User.findOne({ phone: demoUser.phone });
        
        if (existingUser) {
            // If user exists, update everything except studentId
            const { studentId: _, ...updateData } = demoUser;
            const result = await User.findOneAndUpdate(
                { phone: demoUser.phone },
                updateData,
                { new: true }
            );
            console.log('Demo user updated successfully:', result);
        } else {
            // If user doesn't exist, create new user with studentId
            const newUser = new User(demoUser);
            const result = await newUser.save();
            console.log('Demo user created successfully:', result);
        }

    } catch (error) {
        console.error('Error updating demo user:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
    }
};

// Run the function
updateDemoUser(); 