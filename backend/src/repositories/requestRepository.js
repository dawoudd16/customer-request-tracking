/**
 * Request Repository
 * 
 * Handles all Firestore operations for the 'requests' collection
 */

const { db } = require('../firebase');

/**
 * Create a new request document with an auto-incremented request number (REQ-0001)
 */
async function createRequest(requestData) {
  const requestRef = db.collection('requests').doc();
  const requestId = requestRef.id;
  const counterRef = db.collection('counters').doc('requests');

  // Atomically increment the request counter and create the request in one transaction
  let requestNumber;
  await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const count = counterDoc.exists ? (counterDoc.data().count || 0) + 1 : 1;
    requestNumber = `REQ-${String(count).padStart(4, '0')}`;
    transaction.set(counterRef, { count }, { merge: true });
    transaction.set(requestRef, {
      ...requestData,
      id: requestId,
      requestNumber
    });
  });

  return {
    id: requestId,
    requestNumber,
    ...requestData
  };
}

/**
 * Convert Firestore timestamp to ISO string for JSON serialization
 */
function convertTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  return timestamp;
}

/**
 * Get request by ID
 */

async function getRequestById(requestId) {
  const requestDoc = await db.collection('requests').doc(requestId).get();
  if (!requestDoc.exists) {
    return null;
  }
  const data = requestDoc.data();
  return {
    id: requestDoc.id,
    ...data,
    // Convert Firestore timestamps to ISO strings for JSON serialization
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    expiredAt: convertTimestamp(data.expiredAt),
    lastReminderAt: convertTimestamp(data.lastReminderAt),
    reviewedAt: convertTimestamp(data.reviewedAt)
  };
}

/**
 * Get request by secure token (for customer access)
 */
async function getRequestByToken(secureToken) {
  const snapshot = await db.collection('requests')
    .where('secureToken', '==', secureToken)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Convert Firestore timestamps to ISO strings for JSON serialization
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    expiredAt: convertTimestamp(data.expiredAt),
    lastReminderAt: convertTimestamp(data.lastReminderAt),
    reviewedAt: convertTimestamp(data.reviewedAt)
  };
}

/**
 * Get all requests assigned to a specific agent
 */
async function getRequestsByAgentId(agentId) {
  // Get all requests for the agent, then sort in memory to avoid index requirement
  const snapshot = await db.collection('requests')
    .where('agentId', '==', agentId)
    .get();
  
  // Sort by createdAt descending in memory
  const requests = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore timestamps to ISO strings for JSON serialization
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      expiredAt: convertTimestamp(data.expiredAt),
      lastReminderAt: convertTimestamp(data.lastReminderAt),
      reviewedAt: convertTimestamp(data.reviewedAt)
    };
  });
  
  requests.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA; // Descending order (newest first)
  });
  
  return requests;
}

/**
 * Get all requests (for manager dashboard)
 * Filters applied in Firestore; sorting done in memory to avoid composite index requirements
 */
async function getAllRequests(filters = {}) {
  let query = db.collection('requests');

  // Apply equality filters (no orderBy in Firestore to avoid composite index requirement)
  if (filters.agentId) {
    query = query.where('agentId', '==', filters.agentId);
  }
  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }

  const snapshot = await query.get();
  const requests = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      expiredAt: convertTimestamp(data.expiredAt),
      lastReminderAt: convertTimestamp(data.lastReminderAt),
      reviewedAt: convertTimestamp(data.reviewedAt)
    };
  });

  // Sort by createdAt descending in memory
  requests.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });

  return requests;
}

/**
 * Update request fields
 */
async function updateRequest(requestId, updates) {
  const requestRef = db.collection('requests').doc(requestId);
  await requestRef.update({
    ...updates,
    updatedAt: new Date()
  });
  
  return getRequestById(requestId);
}

/**
 * Get active requests (not COMPLETED, not EXPIRED) for reminder/expiry jobs
 * Note: Firestore doesn't allow multiple != filters, so we filter in memory
 */
async function getActiveRequests() {
  const snapshot = await db.collection('requests').get();
  
  // Filter in memory to avoid Firestore limitation with multiple != filters
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(request => request.status !== 'COMPLETED' && request.status !== 'EXPIRED');
}

/**
 * Get requests that need expiry check (not COMPLETED)
 */
async function getRequestsForExpiryCheck() {
  const snapshot = await db.collection('requests')
    .where('status', '!=', 'COMPLETED')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

module.exports = {
  createRequest,
  getRequestById,
  getRequestByToken,
  getRequestsByAgentId,
  getAllRequests,
  updateRequest,
  getActiveRequests,
  getRequestsForExpiryCheck
};

