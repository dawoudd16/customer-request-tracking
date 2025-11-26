/**
 * Diagnostic script to check:
 * 1. Current user IDs in the system
 * 2. Which requests belong to which users
 * 3. Help identify why requests aren't showing
 */

require('dotenv').config();
const { db } = require('../src/firebase');

async function checkUserAndRequests() {
  console.log('=== User and Request Diagnostic ===\n');

  try {
    // 1. Get all users
    console.log('1. Users in the system:');
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - User ID: ${doc.id}`);
      console.log(`     Name: ${data.name || 'N/A'}`);
      console.log(`     Email: ${data.email || 'N/A'}`);
      console.log(`     Role: ${data.role || 'N/A'}`);
      console.log('');
    });

    // 2. Get all requests and their agent assignments
    console.log('2. Requests and their assigned agents:');
    const requestsSnapshot = await db.collection('requests').get();
    
    if (requestsSnapshot.empty) {
      console.log('   No requests found in database.\n');
    } else {
      console.log(`   Total requests: ${requestsSnapshot.size}\n`);
      
      requestsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   Request ID: ${doc.id}`);
        console.log(`     Customer: ${data.customerName || 'N/A'}`);
        console.log(`     Status: ${data.status || 'N/A'}`);
        console.log(`     Assigned to Agent ID: ${data.agentId || 'N/A'}`);
        
        // Check if agent exists
        if (data.agentId) {
          db.collection('users').doc(data.agentId).get().then(agentDoc => {
            if (agentDoc.exists) {
              const agentData = agentDoc.data();
              console.log(`     Agent Name: ${agentData.name || 'N/A'}`);
            } else {
              console.log(`     ⚠️  WARNING: Agent ${data.agentId} not found in users collection!`);
            }
          });
        }
        console.log('');
      });
    }

    // 3. Summary
    console.log('3. Summary:');
    console.log(`   - Total users: ${usersSnapshot.size}`);
    console.log(`   - Total requests: ${requestsSnapshot.size}`);
    
    // Group requests by agentId
    const requestsByAgent = {};
    requestsSnapshot.docs.forEach(doc => {
      const agentId = doc.data().agentId;
      if (agentId) {
        requestsByAgent[agentId] = (requestsByAgent[agentId] || 0) + 1;
      }
    });
    
    console.log('\n   Requests per agent:');
    Object.entries(requestsByAgent).forEach(([agentId, count]) => {
      console.log(`     - Agent ${agentId}: ${count} request(s)`);
    });

    console.log('\n=== Diagnostic Complete ===');
    console.log('\nIf you see no requests in the dashboard:');
    console.log('1. Make sure you are logged in with the correct user account');
    console.log('2. The requests are assigned to a specific agentId');
    console.log('3. Tele-Sales dashboard only shows requests for the logged-in agent');
    console.log('4. Manager dashboard shows all requests regardless of agentId');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkUserAndRequests()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

