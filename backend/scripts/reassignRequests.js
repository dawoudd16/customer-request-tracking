/**
 * Script to reassign requests to a different agent
 * 
 * Usage: node scripts/reassignRequests.js <newAgentId>
 * 
 * This will reassign ALL requests to the specified agentId
 */

require('dotenv').config();
const { db } = require('../src/firebase');

async function reassignRequests(newAgentId) {
  if (!newAgentId) {
    console.error('❌ Error: Please provide a new agent ID');
    console.log('\nUsage: node scripts/reassignRequests.js <newAgentId>');
    console.log('\nTo find agent IDs, run: node scripts/checkUserAndRequests.js');
    process.exit(1);
  }

  console.log(`Reassigning all requests to agent: ${newAgentId}\n`);

  try {
    // Verify the agent exists
    const agentDoc = await db.collection('users').doc(newAgentId).get();
    if (!agentDoc.exists) {
      console.error(`❌ Error: Agent ${newAgentId} not found in users collection`);
      console.log('\nAvailable agents:');
      const usersSnapshot = await db.collection('users').where('role', '==', 'agent').get();
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name || 'N/A'} (${data.email || 'N/A'})`);
      });
      process.exit(1);
    }

    const agentData = agentDoc.data();
    if (agentData.role !== 'agent') {
      console.error(`❌ Error: User ${newAgentId} is not an agent (role: ${agentData.role})`);
      process.exit(1);
    }

    console.log(`✓ Agent verified: ${agentData.name || 'N/A'} (${agentData.email || 'N/A'})\n`);

    // Get all requests
    const requestsSnapshot = await db.collection('requests').get();
    
    if (requestsSnapshot.empty) {
      console.log('No requests found to reassign.');
      process.exit(0);
    }

    console.log(`Found ${requestsSnapshot.size} request(s) to reassign...\n`);

    // Reassign each request
    let reassignedCount = 0;
    for (const doc of requestsSnapshot.docs) {
      const requestData = doc.data();
      const oldAgentId = requestData.agentId;
      
      await db.collection('requests').doc(doc.id).update({
        agentId: newAgentId,
        updatedAt: new Date()
      });

      reassignedCount++;
      console.log(`✓ Reassigned request ${doc.id} (${requestData.customerName || 'N/A'})`);
      console.log(`  From: ${oldAgentId || 'N/A'}`);
      console.log(`  To: ${newAgentId}\n`);
    }

    console.log(`✅ Successfully reassigned ${reassignedCount} request(s) to agent ${newAgentId}`);
    console.log(`\nAgent name: ${agentData.name || 'N/A'}`);
    console.log(`Agent email: ${agentData.email || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error reassigning requests:', error);
    process.exit(1);
  }
}

// Get newAgentId from command line arguments
const newAgentId = process.argv[2];

// Run the script
reassignRequests(newAgentId)
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });



