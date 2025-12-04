/**
 * Test script to verify the /api/telesales/me endpoint
 * 
 * This helps debug why the user name might not be showing
 * 
 * Note: This requires a valid Firebase ID token
 */

require('dotenv').config();
const { admin, db } = require('../src/firebase');

async function testUserEndpoint() {
  console.log('=== Testing User Endpoint ===\n');

  try {
    // Get all agents from the database
    const usersSnapshot = await db.collection('users').where('role', '==', 'agent').get();
    
    if (usersSnapshot.empty) {
      console.log('No agents found in database.\n');
      return;
    }

    console.log('Agents in database:');
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - User ID: ${doc.id}`);
      console.log(`    Name: ${data.name || 'NOT SET'}`);
      console.log(`    Email: ${data.email || 'NOT SET'}`);
      console.log(`    Role: ${data.role || 'NOT SET'}`);
      console.log('');
    });

    console.log('=== Test Complete ===');
    console.log('\nTo test the endpoint:');
    console.log('1. Open browser console on your website');
    console.log('2. Run: firebase.auth().currentUser.getIdToken().then(token => console.log(token))');
    console.log('3. Copy the token');
    console.log('4. Use Postman or curl to test:');
    console.log('   curl -H "Authorization: Bearer <token>" http://localhost:3001/api/telesales/me');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUserEndpoint()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });



