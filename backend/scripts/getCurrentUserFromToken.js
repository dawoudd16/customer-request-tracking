/**
 * Helper script to decode a Firebase ID token and show the user ID
 * 
 * This helps identify which user account you're logged in with
 * 
 * Usage: 
 * 1. Open browser console on your website
 * 2. Run: firebase.auth().currentUser.getIdToken().then(token => console.log(token))
 * 3. Copy the token
 * 4. Run: node scripts/getCurrentUserFromToken.js <token>
 */

require('dotenv').config();
const { admin } = require('../src/firebase');

async function getCurrentUser(token) {
  if (!token) {
    console.error('❌ Error: Please provide a Firebase ID token');
    console.log('\nTo get your token:');
    console.log('1. Open browser console on your website');
    console.log('2. Run: firebase.auth().currentUser.getIdToken().then(token => console.log(token))');
    console.log('3. Copy the token');
    console.log('4. Run: node scripts/getCurrentUserFromToken.js <token>');
    process.exit(1);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    console.log('=== Current User Info ===\n');
    console.log(`User ID (UID): ${decodedToken.uid}`);
    console.log(`Email: ${decodedToken.email || 'N/A'}`);
    console.log(`Name: ${decodedToken.name || 'N/A'}`);
    
    // Get user role from Firestore
    const { db } = require('../src/firebase');
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`Role: ${userData.role || 'N/A'}`);
      console.log(`Display Name: ${userData.name || 'N/A'}`);
      
      if (userData.role === 'agent') {
        console.log('\n✓ You are logged in as an agent');
        console.log('You should see requests assigned to your user ID:', decodedToken.uid);
      } else if (userData.role === 'manager') {
        console.log('\n✓ You are logged in as a manager');
        console.log('You should see all requests in the manager dashboard');
      }
    } else {
      console.log('\n⚠️  User not found in Firestore users collection');
    }
    
  } catch (error) {
    console.error('❌ Error verifying token:', error.message);
    if (error.code === 'auth/argument-error') {
      console.log('\nThe token you provided is invalid or malformed.');
    } else if (error.code === 'auth/id-token-expired') {
      console.log('\nThe token has expired. Please get a fresh token.');
    }
    process.exit(1);
  }
}

const token = process.argv[2];
getCurrentUser(token)
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });












