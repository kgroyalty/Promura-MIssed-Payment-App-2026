
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwMaBvh0frZ4wZBd3Y4bZP4KrcVgkkXDU",
  authDomain: "promura-melon-tracker.firebaseapp.com",
  projectId: "promura-melon-tracker",
  storageBucket: "promura-melon-tracker.firebasestorage.app",
  messagingSenderId: "420365252819",
  appId: "1:420365252819:web:e90dc533d60070ef047c26",
  measurementId: "G-J376G7BQG2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
