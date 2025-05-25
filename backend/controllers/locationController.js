const User = require('../models/User');

// Update user location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.userId;

    // Update user location
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    user.lastActive = Date.now();
    user.isActive = true;
    await user.save();

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get nearby users
exports.getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 4 } = req.body; // maxDistance in kilometers
    const userId = req.user.userId;

    // Find nearby users using geospatial query
    const nearbyUsers = await User.find({
      _id: { $ne: userId }, // Exclude current user
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    }).select('-password');

    // Calculate distances
    const usersWithDistance = nearbyUsers.map(user => {
      const distance = calculateDistance(
        latitude,
        longitude,
        user.location.coordinates[1],
        user.location.coordinates[0]
      );
      return {
        ...user.toObject(),
        distance
      };
    });

    // Sort by distance
    usersWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(usersWithDistance);
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
} 