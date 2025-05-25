import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// Create a new chat request
export const createChatRequest = async (fromUserId, toUserId) => {
  try {
    const chatRequestsRef = collection(db, 'chatRequests');
    await addDoc(chatRequestsRef, {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating chat request:', error);
    throw error;
  }
};

// Accept a chat request
export const acceptChatRequest = async (requestId) => {
  try {
    const chatRequestsRef = collection(db, 'chatRequests');
    await updateDoc(doc(chatRequestsRef, requestId), {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error accepting chat request:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (chatId, userId, message) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      userId,
      message,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Listen to messages in a chat
export const listenToMessages = (chatId, callback) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(messages);
  });
};

// Listen to chat requests
export const listenToChatRequests = (userId, callback) => {
  const requestsRef = collection(db, 'chatRequests');
  const q = query(
    requestsRef,
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(requests);
  });
}; 