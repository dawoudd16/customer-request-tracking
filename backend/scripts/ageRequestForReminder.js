/**
 * Script to age a request for reminder testing
 * 
 * This sets a request's createdAt to be 24+ hours ago so reminders trigger immediately
 * 
 * Usage: 
 *   node scripts/ageRequestForReminder.js <requestId> [hours]
 * 
 * Examples:
 *   node scripts/ageRequestForReminder.js <requestId> 24  (24 hours ago - first reminder)
 *   node scripts/ageRequestForReminder.js <requestId> 48  (48 hours ago - second reminder)
 */

require('dotenv').config();
const { db } = require('../src/firebase');

async function ageRequestForReminder(requestId, hoursAgo = 24) {
  if (!requestId) {
    console.error('❌ Error: Please provide a request ID');
    console.log('\nUsage: node scripts/ageRequestForReminder.js <requestId> [hours]');
    console.log('\nExamples:');
    console.log('  node scripts/ageRequestForReminder.js <requestId> 24  (24 hours ago - first reminder)');
    console.log('  node scripts/ageRequestForReminder.js <requestId> 48  (48 hours ago - second reminder)');
    console.log('\nTo find request IDs, run: node scripts/testReminders.js');
    process.exit(1);
  }

  try {
    console.log(`=== Aging Request for Reminder Testing ===\n`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Setting createdAt to ${hoursAgo} hours ago\n`);

    // Get the request first
    const requestDoc = await db.collection('requests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      console.error(`❌ Error: Request ${requestId} not found`);
      process.exit(1);
    }

    const request = requestDoc.data();
    console.log(`Current request info:`);
    console.log(`  Customer: ${request.customerName || 'N/A'}`);
    console.log(`  Status: ${request.status || 'N/A'}`);
    console.log(`  Current Reminder Level: ${request.needsReminderLevel || 0}`);
    console.log(`  Current createdAt: ${request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : 'N/A'}\n`);

    // Calculate the new createdAt date (hoursAgo hours in the past)
    const now = new Date();
    const newCreatedAt = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));

    // Update the request
    await db.collection('requests').doc(requestId).update({
      createdAt: newCreatedAt,
      updatedAt: new Date()
    });

    console.log(`✓ Updated request createdAt to: ${newCreatedAt.toLocaleString()}`);
    console.log(`  (${hoursAgo} hours ago)\n`);

    // Now run the reminder job to check if it triggers
    console.log('Running reminder job to check if reminder triggers...\n');
    const reminderJob = require('../src/jobs/reminderJob');
    await reminderJob.processReminders();

    // Check the updated request
    const updatedDoc = await db.collection('requests').doc(requestId).get();
    const updatedRequest = updatedDoc.data();
    
    console.log('\n=== After Reminder Job ===');
    console.log(`  New Reminder Level: ${updatedRequest.needsReminderLevel || 0}`);
    
    if (updatedRequest.needsReminderLevel === 1) {
      console.log(`  🟡 FIRST REMINDER triggered! (24h)`);
    } else if (updatedRequest.needsReminderLevel === 2) {
      console.log(`  🔴 SECOND REMINDER triggered! (48h)`);
    } else {
      console.log(`  ⚠️  No reminder triggered. Check if status is eligible (OPEN, IN_PROGRESS, or SUBMITTED)`);
    }

    console.log('\n✅ Done! Refresh your dashboard to see the reminder badge.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const requestId = process.argv[2];
const hoursAgo = parseInt(process.argv[3]) || 24;

// Run the script
ageRequestForReminder(requestId, hoursAgo)
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });



