/**
 * Script to check all requests in Firestore
 */

require('dotenv').config();
const { db } = require('../src/firebase');

async function checkRequests() {
  try {
    const requestsSnapshot = await db.collection('requests').get();
    
    console.log(`Total requests: ${requestsSnapshot.size}\n`);
    
    if (requestsSnapshot.size === 0) {
      console.log('No requests found in Firestore.');
      return;
    }
    
    requestsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Request ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Customer: ${data.customerName || 'N/A'}`);
      console.log(`  Phone: ${data.customerPhone || 'N/A'}`);
      console.log(`  Status: ${data.status || 'N/A'}`);
      console.log(`  Agent ID: ${data.agentId || 'N/A'}`);
      console.log(`  Created: ${data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRequests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

