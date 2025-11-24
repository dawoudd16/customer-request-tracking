/**
 * Request Model Schema
 * 
 * Defines the structure and validation for request documents in Firestore
 */

/**
 * Request status values
 */
const REQUEST_STATUS = {
  OPEN: 'OPEN',              // Created, customer may start uploading
  IN_PROGRESS: 'IN_PROGRESS', // Agent actively working
  SUBMITTED: 'SUBMITTED',     // Customer submitted with 100% docs
  COMPLETED: 'COMPLETED',   // Request completed
  EXPIRED: 'EXPIRED'         // Request expired after 6 days
};

/**
 * Review status values
 */
const REVIEW_STATUS = {
  PENDING: 'PENDING',    // Awaiting review
  APPROVED: 'APPROVED',  // Approved by agent/manager
  REJECTED: 'REJECTED'   // Rejected with comment
};

/**
 * Required document types
 */
const DOCUMENT_TYPES = {
  ID: 'ID',
  LICENCE: 'LICENCE',
  PROOF_OF_ADDRESS: 'PROOF_OF_ADDRESS',
  BANK_STATEMENT: 'BANK_STATEMENT'
};

/**
 * Reminder levels
 */
const REMINDER_LEVEL = {
  NONE: 0,    // No reminder needed
  FIRST: 1,   // 24h reminder (yellow badge)
  SECOND: 2  // 48h reminder (red badge)
};

/**
 * Creates a new request object with default values
 */
function createRequest(data) {
  const now = new Date();
  
  return {
    customerId: data.customerId,
    agentId: data.agentId,
    status: REQUEST_STATUS.OPEN,
    createdAt: now,
    updatedAt: now,
    expiredAt: null,
    completionPercent: 0,
    needsReminderLevel: REMINDER_LEVEL.NONE,
    lastReminderAt: null,
    notes: data.notes || '',
    secureToken: data.secureToken, // High-entropy token for customer access
    reviewStatus: REVIEW_STATUS.PENDING,
    reviewComment: null,
    reviewedBy: null,
    reviewedAt: null,
    sourceSystem: data.sourceSystem || null,
    // Additional fields from creation
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || null,
    dealerId: data.dealerId || null,
    vehicleId: data.vehicleId || null
  };
}

/**
 * Validates request status transition
 */
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    [REQUEST_STATUS.OPEN]: [REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.EXPIRED],
    [REQUEST_STATUS.IN_PROGRESS]: [REQUEST_STATUS.OPEN, REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.EXPIRED],
    [REQUEST_STATUS.SUBMITTED]: [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.EXPIRED],
    [REQUEST_STATUS.EXPIRED]: [REQUEST_STATUS.OPEN], // Can be reopened
    [REQUEST_STATUS.COMPLETED]: [] // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

module.exports = {
  REQUEST_STATUS,
  REVIEW_STATUS,
  DOCUMENT_TYPES,
  REMINDER_LEVEL,
  createRequest,
  isValidStatusTransition
};

