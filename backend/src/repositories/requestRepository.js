/**
 * Request Repository
 * 
 * Handles all Firestore operations for the 'requests' collection
 */

const { db } = require('../firebase');

/**
 * Create a new request document
 */
async function createRequest(requestData) {
  const requestRef = db.collection('requests').doc();
  const requestId = requestRef.id;
  
  await requestRef.set({
    ...requestData,
    id: requestId
  });
  
  return {
    id: requestId,
    ...requestData
  };
}

/**
 * Get request by ID
 */
async function getRequestById(requestId) {
  const requestDoc = await db.collection('requests').doc(requestId).get();
  if (!requestDoc.exists) {
    return null;
  }
  return {
    id: requestDoc.id,
    ...requestDoc.data()
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
  return {
    id: doc.id,
    ...doc.data()
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
  const requests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  requests.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB - dateA; // Descending order (newest first)
  });
  
  return requests;
}

/**
 * Get all requests (for manager dashboard)
 */
async function getAllRequests(filters = {}) {
  let query = db.collection('requests');
  
  // Apply filters
  if (filters.agentId) {
    query = query.where('agentId', '==', filters.agentId);
  }
  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }
  
  // Order by creation date (newest first)
  query = query.orderBy('createdAt', 'desc');
  
  // Apply date range if provided
  if (filters.startDate) {
    query = query.where('createdAt', '>=', filters.startDate);
  }
  if (filters.endDate) {
    query = query.where('createdAt', '<=', filters.endDate);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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
 */
async function getActiveRequests() {
  const snapshot = await db.collection('requests')
    .where('status', '!=', 'COMPLETED')
    .where('status', '!=', 'EXPIRED')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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

