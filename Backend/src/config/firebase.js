import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { getFirestore } from 'firebase-admin/firestore'

dotenv.config() // Load environment variables

// Initialize Firebase only once (prevents re-initialization issues)
if(!admin.apps.length){
    admin.initializeApp({
      credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Fix newline issue in private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
})
}

// Use specific Firestore database or default
const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';

// Initialize Firestore instance
export const db = getFirestore(admin.app(), databaseId);

// Ignore undefined fields to prevent Firestore errors
db.settings({ ignoreUndefinedProperties: true });

// Log config for debugging
console.log(`[firebase] project=${process.env.FIREBASE_PROJECT_ID} database=${databaseId}`);

export default admin; // Export admin SDK