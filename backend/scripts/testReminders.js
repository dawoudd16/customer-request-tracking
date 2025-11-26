/**
 * Test script to check reminder system
 * 
 * This script helps verify that reminders are working correctly
 * Run: node scripts/testReminders.js
 */

require('dotenv').config();
const { db } = require('../src/firebase');
const { REQUEST_STATUS, REMINDER_LEVEL } = require('../src/models/request');

function hoursBetween(date1, date2) {
  return Math.abs(date2 - date1) / (1000 * 60 * 60);
}

async function testReminders() {
  console.log('=== Reminder System Test ===\n');

  try {
    // Get all requests and filter in memory (Firestore doesn't allow multiple != filters)
    const requestsSnapshot = await db.collection('requests').get();

    const now = new Date();
    
    // Filter to only active requests (not COMPLETED, not EXPIRED)
    const activeRequests = requestsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(request => request.status !== 'COMPLETED' && request.status !== 'EXPIRED');

    if (activeRequests.length === 0) {
      console.log('No active requests found.\n');
      return;
    }

    console.log(`Found ${activeRequests.length} active request(s)\n`);

    activeRequests.forEach((request) => {
      const createdAt = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
      const lastReminderAt = request.lastReminderAt?.toDate ? request.lastReminderAt.toDate() : 
                           (request.lastReminderAt ? new Date(request.lastReminderAt) : null);

      const hoursSinceCreation = hoursBetween(createdAt, now);
      const hoursSinceLastReminder = lastReminderAt ? hoursBetween(lastReminderAt, now) : null;

      console.log(`Request ID: ${request.id}`);
      console.log(`  Customer: ${request.customerName || 'N/A'}`);
      console.log(`  Status: ${request.status}`);
      console.log(`  Current Reminder Level: ${request.needsReminderLevel || 0}`);
      console.log(`  Created: ${createdAt.toLocaleString()} (${hoursSinceCreation.toFixed(1)} hours ago)`);
      
      if (lastReminderAt) {
        console.log(`  Last Reminder: ${lastReminderAt.toLocaleString()} (${hoursSinceLastReminder.toFixed(1)} hours ago)`);
      } else {
        console.log(`  Last Reminder: Never`);
      }

      // Check what reminder should be shown
      const eligibleStatuses = [REQUEST_STATUS.OPEN, REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.SUBMITTED];
      if (eligibleStatuses.includes(request.status)) {
        if (request.needsReminderLevel === REMINDER_LEVEL.NONE) {
          if (lastReminderAt && hoursSinceLastReminder >= 48) {
            console.log(`  ⚠️  Should show SECOND REMINDER (48h) - ${hoursSinceLastReminder.toFixed(1)} hours since last reminder`);
          } else if (hoursSinceCreation >= 24) {
            console.log(`  ⚠️  Should show FIRST REMINDER (24h) - ${hoursSinceCreation.toFixed(1)} hours since creation`);
          } else {
            const hoursUntilFirst = 24 - hoursSinceCreation;
            console.log(`  ✓ No reminder needed yet (${hoursUntilFirst.toFixed(1)} hours until first reminder)`);
          }
        } else if (request.needsReminderLevel === REMINDER_LEVEL.FIRST) {
          console.log(`  🟡 Currently showing FIRST REMINDER (24h)`);
        } else if (request.needsReminderLevel === REMINDER_LEVEL.SECOND) {
          console.log(`  🔴 Currently showing SECOND REMINDER (48h)`);
        }
      } else {
        console.log(`  ⚠️  Status ${request.status} is not eligible for reminders`);
      }

      console.log('');
    });

    console.log('=== Test Complete ===');
    console.log('\nNote: Reminder job runs every hour. If reminders should be shown but aren\'t,');
    console.log('wait for the next scheduled run or manually trigger the reminder job.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testReminders()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

