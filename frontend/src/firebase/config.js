import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB3MMd2DqPhOi3DZ9q9SVzeHWNGYlmhyAA",
  authDomain: "cash-mate-d3606.firebaseapp.com",
  projectId: "cash-mate-d3606",
  storageBucket: "cash-mate-d3606.firebasestorage.app",
  messagingSenderId: "141486071335",
  appId: "1:141486071335:web:ae98ddc12cab91cc73f802",
  measurementId: "G-YZZHNXNWM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, analytics }; 