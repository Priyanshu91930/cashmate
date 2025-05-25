const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active users
const activeUsers = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'UPDATE_LOCATION':
          // Update user location
          activeUsers.set(data.userId, {
            ...data,
            lastActive: Date.now()
          });
          
          // Broadcast to all clients
          broadcastUsers();
          break;
          
        case 'GET_NEARBY_USERS':
          // Send nearby users to requesting client
          const nearbyUsers = getNearbyUsers(data.latitude, data.longitude, 4);
          ws.send(JSON.stringify({
            type: 'NEARBY_USERS',
            users: nearbyUsers
          }));
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove inactive users
    const now = Date.now();
    for (const [userId, user] of activeUsers.entries()) {
      if (now - user.lastActive > 30000) { // 30 seconds timeout
        activeUsers.delete(userId);
      }
    }
    broadcastUsers();
  });
});

// Helper function to get nearby users
function getNearbyUsers(latitude, longitude, radiusKm) {
  const users = Array.from(activeUsers.values());
  return users
    .filter(user => {
      const distance = calculateDistance(
        latitude,
        longitude,
        user.latitude,
        user.longitude
      );
      return distance <= radiusKm;
    })
    .map(user => ({
      ...user,
      distance: calculateDistance(
        latitude,
        longitude,
        user.latitude,
        user.longitude
      )
    }))
    .sort((a, b) => a.distance - b.distance);
}

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Broadcast active users to all clients
function broadcastUsers() {
  const users = Array.from(activeUsers.values());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'ACTIVE_USERS',
        users: users
      }));
    }
  });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 