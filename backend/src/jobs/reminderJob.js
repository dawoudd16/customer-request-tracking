/**
 * Reminder Job
 * 
 * Scheduled job that runs every hour to check and update reminder levels
 * 
 * Business Rules:
 * 1. First Reminder (24h): Set needsReminderLevel = 1 if:
 *    - (now - createdAt) >= 24 hours
 *    - status in ["OPEN", "IN_PROGRESS", "SUBMITTED"]
 *    - needsReminderLevel === 0
 * 
 * 2. Second Reminder (48h): Set needsReminderLevel = 2 if:
 *    - status in ["OPEN", "IN_PROGRESS", "SUBMITTED"]
 *    - lastReminderAt is not null
 *    - needsReminderLevel === 0
 *    - (now - lastReminderAt) >= 48 hours
 */

const requestRepository = require('../repositories/requestRepository');
const { REQUEST_STATUS, REMINDER_LEVEL } = require('../models/request');

/**
 * Calculate hours between two dates
 */
function hoursBetween(date1, date2) {
  return Math.abs(date2 - date1) / (1000 * 60 * 60);
}

/**
 * Process reminder logic for all active requests
 */
async function processReminders() {
  try {
    console.log('[Reminder Job] Starting reminder check...');

    // Get all active requests (not COMPLETED, not EXPIRED)
    const activeRequests = await requestRepository.getActiveRequests();
    const now = new Date();

    let firstReminderCount = 0;
    let secondReminderCount = 0;

    for (const request of activeRequests) {
      const updates = {};

      // Convert Firestore timestamps to Date objects if needed
      const createdAt = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
      const lastReminderAt = request.lastReminderAt?.toDate ? request.lastReminderAt.toDate() : 
                           (request.lastReminderAt ? new Date(request.lastReminderAt) : null);

      // Check if status is eligible for reminders
      const eligibleStatuses = [REQUEST_STATUS.OPEN, REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.SUBMITTED];
      if (!eligibleStatuses.includes(request.status)) {
        continue;
      }

      // FIRST REMINDER: 24 hours after creation (only if currently at NONE level)
      if (request.needsReminderLevel === REMINDER_LEVEL.NONE) {
        const hoursSinceCreation = hoursBetween(createdAt, now);
        
        if (hoursSinceCreation >= 24) {
          updates.needsReminderLevel = REMINDER_LEVEL.FIRST;
          firstReminderCount++;
        }
      }
      // SECOND REMINDER: 48 hours after last reminder confirmation (if currently at FIRST level)
      else if (request.needsReminderLevel === REMINDER_LEVEL.FIRST && lastReminderAt) {
        const hoursSinceLastReminder = hoursBetween(lastReminderAt, now);
        
        if (hoursSinceLastReminder >= 48) {
          updates.needsReminderLevel = REMINDER_LEVEL.SECOND;
          secondReminderCount++;
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await requestRepository.updateRequest(request.id, updates);
        console.log(`[Reminder Job] Updated request ${request.id}: needsReminderLevel = ${updates.needsReminderLevel}`);
      }
    }

    console.log(`[Reminder Job] Completed. First reminders: ${firstReminderCount}, Second reminders: ${secondReminderCount}`);
  } catch (error) {
    console.error('[Reminder Job] Error:', error);
  }
}

module.exports = {
  processReminders
};

