/**
 * Request Service
 * 
 * Contains business logic for request operations
 * This layer sits between controllers and repositories
 */

const requestRepository = require('../repositories/requestRepository');
const documentRepository = require('../repositories/documentRepository');
const userRepository = require('../repositories/userRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const { createRequest: createRequestModel, REQUEST_STATUS, REVIEW_STATUS } = require('../models/request');
const crypto = require('crypto');

/**
 * Generate a high-entropy secure token for customer access
 * This token should be unguessable and unique
 */
function generateSecureToken() {
  // Generate 32 random bytes and convert to base64url
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a new customer request
 * 
 * Business rules:
 * - Creates customer user if doesn't exist
 * - Generates secure token for customer access
 * - Sets initial status to OPEN
 * - Creates audit log entry
 */
async function createRequest(agentId, requestData, actorIp = null) {
  // Find or create customer user
  const customer = await userRepository.findOrCreateCustomer({
    name: requestData.customerName,
    phone: requestData.customerPhone,
    email: requestData.customerEmail
  });

  // Generate secure token for customer portal access
  const secureToken = generateSecureToken();

  // Create request document
  const request = createRequestModel({
    customerId: customer.id,
    agentId: agentId,
    secureToken: secureToken,
    customerName: requestData.customerName,
    customerPhone: requestData.customerPhone,
    customerEmail: requestData.customerEmail,
    dealerId: requestData.dealerId,
    vehicleId: requestData.vehicleId,
    notes: requestData.notes
  });

  const createdRequest = await requestRepository.createRequest(request);

  // Create audit log
  await auditLogRepository.createAuditLog({
    actorId: agentId,
    action: 'REQUEST_CREATED',
    requestId: createdRequest.id,
    ip: actorIp,
    metadata: {
      customerName: requestData.customerName,
      customerPhone: requestData.customerPhone
    }
  });

  return {
    ...createdRequest,
    customerLink: `/customer/${secureToken}`
  };
}

/**
 * Get request details including documents
 */
async function getRequestDetails(requestId) {
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    return null;
  }

  const documentStatus = await documentRepository.getDocumentUploadStatus(requestId);

  // Only return document files after customer has submitted — not while they're still uploading
  const showDocuments = ['SUBMITTED', 'COMPLETED'].includes(request.status) ||
                        ['APPROVED', 'REJECTED'].includes(request.reviewStatus);
  const documents = showDocuments
    ? await documentRepository.getDocumentsByRequestId(requestId)
    : [];

  return {
    ...request,
    documents,
    documentStatus
  };
}

/**
 * Update request status and/or notes
 */
async function updateRequest(requestId, updates, actorId, actorIp = null) {
  const currentRequest = await requestRepository.getRequestById(requestId);
  if (!currentRequest) {
    throw new Error('Request not found');
  }

  const updateData = {};

  // Update status if provided
  if (updates.status && updates.status !== currentRequest.status) {
    // Validate status transition (basic check - can be enhanced)
    if (currentRequest.status === REQUEST_STATUS.EXPIRED && updates.status !== REQUEST_STATUS.OPEN) {
      throw new Error('Expired requests can only be reopened (set to OPEN)');
    }
    updateData.status = updates.status;
    
    // Create audit log for status change
    await auditLogRepository.createAuditLog({
      actorId: actorId,
      action: 'STATUS_CHANGED',
      requestId: requestId,
      ip: actorIp,
      metadata: {
        oldStatus: currentRequest.status,
        newStatus: updates.status
      }
    });
  }

  // Update notes if provided
  if (updates.notes !== undefined && updates.notes !== currentRequest.notes) {
    updateData.notes = updates.notes;
    
    await auditLogRepository.createAuditLog({
      actorId: actorId,
      action: 'NOTES_UPDATED',
      requestId: requestId,
      ip: actorIp
    });
  }

  if (Object.keys(updateData).length === 0) {
    return currentRequest; // No changes
  }

  return await requestRepository.updateRequest(requestId, updateData);
}

/**
 * Mark that agent reminded the customer
 * 
 * Business rules:
 * - Resets reminder level to 0
 * - Sets lastReminderAt to now
 * - Creates audit log
 */
async function markReminderConfirmed(requestId, actorId, actorIp = null) {
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status === REQUEST_STATUS.EXPIRED) {
    throw new Error('Cannot confirm reminder for expired request');
  }

  await requestRepository.updateRequest(requestId, {
    needsReminderLevel: 0,
    lastReminderAt: new Date()
  });

  await auditLogRepository.createAuditLog({
    actorId: actorId,
    action: 'REMINDER_CONFIRMED',
    requestId: requestId,
    ip: actorIp
  });

  return await requestRepository.getRequestById(requestId);
}

/**
 * Reopen an expired request
 * 
 * Business rules:
 * - Only works if status is EXPIRED
 * - Sets status to OPEN
 * - Clears expiredAt
 * - Resets reminder level
 */
async function reopenRequest(requestId, actorId, actorIp = null) {
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status !== REQUEST_STATUS.EXPIRED) {
    throw new Error('Can only reopen expired requests');
  }

  await requestRepository.updateRequest(requestId, {
    status: REQUEST_STATUS.OPEN,
    expiredAt: null,
    needsReminderLevel: 0,
    lastReminderAt: null
  });

  await auditLogRepository.createAuditLog({
    actorId: actorId,
    action: 'REQUEST_REOPENED',
    requestId: requestId,
    ip: actorIp
  });

  return await requestRepository.getRequestById(requestId);
}

/**
 * Review request (Approve or Reject)
 * 
 * Business rules:
 * - Only works if status is SUBMITTED
 * - Sets reviewStatus and reviewComment
 * - Records who reviewed and when
 * - If APPROVED: Automatically changes status to COMPLETED
 * - If REJECTED: Changes status to IN_PROGRESS so customer can fix and resubmit
 */
async function reviewRequest(requestId, decision, comment, actorId, actorIp = null, rejectedDocumentTypes = []) {
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status !== REQUEST_STATUS.SUBMITTED) {
    throw new Error('Can only review submitted requests');
  }

  if (decision === 'REJECT' && !comment) {
    throw new Error('Rejection comment is required');
  }

  if (decision === 'REJECT' && (!rejectedDocumentTypes || rejectedDocumentTypes.length === 0)) {
    throw new Error('At least one document must be selected for the customer to re-upload');
  }

  const reviewStatus = decision === 'APPROVE' ? REVIEW_STATUS.APPROVED : REVIEW_STATUS.REJECTED;

  // Prepare update data
  const updateData = {
    reviewStatus: reviewStatus,
    reviewComment: comment || null,
    reviewedBy: actorId,
    reviewedAt: new Date()
  };

  // If approved, automatically change status to COMPLETED
  if (decision === 'APPROVE') {
    updateData.status = REQUEST_STATUS.COMPLETED;
    updateData.rejectedDocumentTypes = [];
  }
  // If rejected, change status back to IN_PROGRESS so customer can fix and resubmit
  // Keep reviewStatus as REJECTED so customer can see the rejection comment
  else if (decision === 'REJECT') {
    updateData.status = REQUEST_STATUS.IN_PROGRESS;
    updateData.rejectedDocumentTypes = rejectedDocumentTypes;
  }

  await requestRepository.updateRequest(requestId, updateData);

  await auditLogRepository.createAuditLog({
    actorId: actorId,
    action: decision === 'APPROVE' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
    requestId: requestId,
    ip: actorIp,
    metadata: {
      comment: comment,
      rejectedDocumentTypes: rejectedDocumentTypes
    }
  });

  return await requestRepository.getRequestById(requestId);
}

/**
 * Delete a request and all associated data
 * 
 * Business rules:
 * - Only the agent who owns the request can delete it
 * - Deletes request, documents, files, and audit logs
 * - Note: Audit logs are deleted, so deletion won't be logged
 */
async function deleteRequest(requestId, actorId, actorIp = null) {
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  // Verify agent owns this request
  if (request.agentId !== actorId) {
    throw new Error('You do not have permission to delete this request');
  }

  const { db, storage } = require('../firebase');
  const documentRepository = require('../repositories/documentRepository');

  // 1. Get all documents for this request
  const documents = await documentRepository.getDocumentsByRequestId(requestId);

  // 2. Delete all files from Storage
  const bucket = storage.bucket('customer-request-tracking.firebasestorage.app');
  for (const doc of documents) {
    if (doc.storagePath) {
      try {
        const file = bucket.file(doc.storagePath);
        await file.delete().catch(() => {
          // Ignore errors if file doesn't exist
        });
      } catch (err) {
        console.warn(`Could not delete file ${doc.storagePath}:`, err.message);
      }
    }
  }

  // 3. Delete all document records from Firestore
  for (const doc of documents) {
    await db.collection('documents').doc(doc.id).delete();
  }

  // 4. Delete all audit logs for this request
  const auditLogsSnapshot = await db.collection('auditLogs')
    .where('requestId', '==', requestId)
    .get();
  
  const auditLogDeletes = auditLogsSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(auditLogDeletes);

  // 5. Delete the request itself
  await db.collection('requests').doc(requestId).delete();

  // Note: We don't create an audit log for deletion since we're deleting all audit logs
  // for this request anyway. The deletion is logged in the application logs.

  return { success: true, deletedRequestId: requestId };
}

module.exports = {
  createRequest,
  getRequestDetails,
  updateRequest,
  markReminderConfirmed,
  reopenRequest,
  reviewRequest,
  deleteRequest
};

