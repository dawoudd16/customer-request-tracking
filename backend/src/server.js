/**
 * Server Entry Point
 * 
 * Starts the Express server and initializes scheduled jobs
 */

const app = require('./app');
const cron = require('node-cron');
const reminderJob = require('./jobs/reminderJob');
const slaExpiryJob = require('./jobs/slaExpiryJob');

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Schedule jobs to run every hour
// Cron format: minute hour day month day-of-week
// '0 * * * *' means: at minute 0 of every hour

// Reminder job: runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running reminder job...');
  await reminderJob.processReminders();
});

// SLA expiry job: runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running SLA expiry job...');
  await slaExpiryJob.processExpiry();
});

// Run jobs immediately on startup (optional, for testing)
// Uncomment if you want to run jobs on server start
// reminderJob.processReminders();
// slaExpiryJob.processExpiry();

console.log('Scheduled jobs initialized (running every hour)');

