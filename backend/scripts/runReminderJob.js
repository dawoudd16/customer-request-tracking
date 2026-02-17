/**
 * Manually trigger the reminder job
 * 
 * This script runs the reminder job immediately instead of waiting for the scheduled time
 * Useful for testing or if you need to update reminders right away
 * 
 * Run: node scripts/runReminderJob.js
 */

require('dotenv').config();
const reminderJob = require('../src/jobs/reminderJob');

async function runReminderJob() {
  console.log('=== Manually Running Reminder Job ===\n');
  
  try {
    await reminderJob.processReminders();
    console.log('\n✅ Reminder job completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running reminder job:', error);
    process.exit(1);
  }
}

runReminderJob()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });












