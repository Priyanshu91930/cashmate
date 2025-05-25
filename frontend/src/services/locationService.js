import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  GeoPoint,
  serverTimestamp 
} from 'firebase/firestore';

// Update user location
export const updateUserLocation = async (userId, location) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      location: new GeoPoint(location.latitude, location.longitude),
      lastActive: serverTimestamp(),
      isActive: true
    });
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Get nearby users
export const getNearbyUsers = (center, radiusInKm, callback) => {
  // Create a query to get users within the radius
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('isActive', '==', true)
  );

  // Set up real-time listener
  return onSnapshot(q, (snapshot) => {
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.location) {
        const distance = calculateDistance(
          center.latitude,
          center.longitude,
          userData.location.latitude,
          userData.location.longitude
        );
        
        if (distance <= radiusInKm) {
          users.push({
            id: doc.id,
            ...userData,
            distance
          });
        }
      }
    });
    callback(users);
  });
};

// Calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Set user as inactive
export const setUserInactive = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('Error setting user inactive:', error);
    throw error;
  }
}; 