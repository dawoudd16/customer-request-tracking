/**
 * Script to manually run the SLA expiry job
 * 
 * This checks all non-completed requests and expires those that are 6+ days old
 * 
 * Usage: 
 *   node scripts/runExpiryJob.js
 */

require('dotenv').config();
const expiryJob = require('../src/jobs/slaExpiryJob');

console.log('=== Manually Running SLA Expiry Job ===\n');

expiryJob.processExpiry()
  .then(() => {
    console.log('\n✅ Expiry job completed successfully!');
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });



