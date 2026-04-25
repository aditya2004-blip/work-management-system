// Import Firebase core and required services
import { initializeApp } from 'firebase/app';      // Initializes Firebase app
import { getFirestore } from 'firebase/firestore'; // Firestore database service
import { getAuth } from 'firebase/auth';           // Authentication service

// Firebase configuration object
// Values are stored in environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,                 // API key for your Firebase project
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,         // Auth domain (used for login)
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,           // Unique project ID
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,   // Storage bucket for files
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // Messaging ID (for push notifications)
  appId: import.meta.env.VITE_FIREBASE_APP_ID,                   // Unique app identifier
};

// Initialize Firebase app with config
const app = initializeApp(firebaseConfig);

// Initialize Firestore database instance
export const db = getFirestore(app);

// Initialize Firebase Authentication instance
export const auth = getAuth(app);

// Export app if needed elsewhere
export default app;