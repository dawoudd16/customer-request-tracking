/**
 * SLA Expiry Job
 * 
 * Scheduled job that runs every hour to expire requests that exceed the SLA
 * 
 * Business Rules:
 * - Requests expire after 6 days (144 hours) from creation if not COMPLETED
 * - When expired:
 *   - Set status = "EXPIRED"
 *   - Set expiredAt = now
 * - Expired requests become read-only for customers
 * - Tele-Sales and Managers can reopen expired requests
 */

const requestRepository = require('../repositories/requestRepository');
const { REQUEST_STATUS } = require('../models/request');

/**
 * Calculate hours between two dates
 */
function hoursBetween(date1, date2) {
  return Math.abs(date2 - date1) / (1000 * 60 * 60);
}

/**
 * Process expiry logic for all non-completed requests
 */
async function processExpiry() {
  try {
    console.log('[SLA Expiry Job] Starting expiry check...');

    // Get all requests that are not COMPLETED
    const requests = await requestRepository.getRequestsForExpiryCheck();
    const now = new Date();

    const SLA_HOURS = 144; // 6 days
    let expiredCount = 0;

    for (const request of requests) {
      // Skip if already expired
      if (request.status === REQUEST_STATUS.EXPIRED) {
        continue;
      }

      // Convert Firestore timestamp to Date object if needed
      const createdAt = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
      const hoursSinceCreation = hoursBetween(createdAt, now);

      // Check if request exceeds SLA
      if (hoursSinceCreation >= SLA_HOURS) {
        await requestRepository.updateRequest(request.id, {
          status: REQUEST_STATUS.EXPIRED,
          expiredAt: now
        });

        expiredCount++;
        console.log(`[SLA Expiry Job] Expired request ${request.id} (${hoursSinceCreation.toFixed(1)} hours old)`);
      }
    }

    console.log(`[SLA Expiry Job] Completed. Expired ${expiredCount} request(s)`);
  } catch (error) {
    console.error('[SLA Expiry Job] Error:', error);
  }
}

module.exports = {
  processExpiry
};

