/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes Firebase Admin SDK for backend operations:
 * - Firestore (database)
 * - Firebase Storage (file storage)
 * - Firebase Auth token verification
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK
// Option 1: Using service account JSON file (recommended for development)
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'customer-request-tracking.firebasestorage.app'
  });
} 
// Option 2: Using individual environment variables
else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  });
} 
else {
  // For development/testing, you can use application default credentials
  // Make sure to set up gcloud auth application-default login
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    console.error('Please set up FIREBASE_SERVICE_ACCOUNT_PATH or Firebase environment variables');
  }
}

// Export Firestore and Storage instances
const db = admin.firestore();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  storage
};

