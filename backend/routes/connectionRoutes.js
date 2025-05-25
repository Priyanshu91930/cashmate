const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const CashRequest = require('../models/CashRequest');

// Update user location
router.post('/update-location', async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.body;

        if (!userId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                isOnline: true,
                lastSeen: new Date()
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Location updated successfully',
            user: {
                id: user._id,
                name: user.name,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen
            }
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating location',
            error: error.message
        });
    }
});

// Find nearby users
router.get('/nearby-users', async (req, res) => {
    try {
        const { userId, latitude, longitude, maxDistance = 5000 } = req.query; // maxDistance in meters

        if (!userId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Validate coordinates are numbers
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        const nearbyUsers = await User.find({
            _id: { $ne: userId }, // Exclude current user
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            },
            isOnline: true
        }).select('name profilePhoto course section semester lastSeen');

        res.json({
            success: true,
            users: nearbyUsers
        });
    } catch (error) {
        console.error('Error finding nearby users:', error);
        res.status(500).json({
            success: false,
            message: 'Error finding nearby users',
            error: error.message
        });
    }
});

// Connect users
router.post('/connect', async (req, res) => {
    try {
        const { userId, targetUserId, requestId } = req.body;

        if (!userId || !targetUserId || !requestId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate IDs are valid ObjectIds
        if (!mongoose.Types.ObjectId.isValid(userId) || 
            !mongoose.Types.ObjectId.isValid(targetUserId) || 
            !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        // Check if request exists and is not already connected
        const request = await CashRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status === 'connected') {
            return res.status(400).json({
                success: false,
                message: 'This request is already connected with another user'
            });
        }

        // Check if users exist
        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({
                success: false,
                message: 'One or both users not found'
            });
        }

        // Update request status
        const updatedRequest = await CashRequest.findByIdAndUpdate(requestId, {
            status: 'connected',
            connectedTo: userId
        }, { new: true }).populate('requester connectedTo');

        // Add each user to the other's connections
        await Promise.all([
            User.findByIdAndUpdate(userId, {
            $addToSet: { connections: targetUserId }
            }),
            User.findByIdAndUpdate(targetUserId, {
            $addToSet: { connections: userId }
            })
        ]);

        // Emit WebSocket events
        if (req.app.get('io')) {
            const io = req.app.get('io');
            io.emit('request-connected', {
                requestId: requestId,
                connectedUsers: {
                    userId: userId,
                    targetUserId: targetUserId
                },
                request: updatedRequest
            });
        }

        res.json({
            success: true,
            message: 'Users connected successfully',
            request: updatedRequest
        });
    } catch (error) {
        console.error('Error connecting users:', error);
        res.status(500).json({
            success: false,
            message: 'Error connecting users',
            error: error.message
        });
    }
});

// Get user connections
router.get('/connections/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(userId)
            .populate('connections', 'name profilePhoto course section semester lastSeen isOnline');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            connections: user.connections
        });
    } catch (error) {
        console.error('Error getting connections:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting connections',
            error: error.message
        });
    }
});

module.exports = router; 