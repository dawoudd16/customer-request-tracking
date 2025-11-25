/**
 * Document Service
 * 
 * Contains business logic for document operations
 */

const documentRepository = require('../repositories/documentRepository');
const requestRepository = require('../repositories/requestRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const { REQUEST_STATUS } = require('../models/request');
const { storage } = require('../firebase');

/**
 * Upload a document for a request
 * 
 * Business rules:
 * - Request must not be EXPIRED
 * - Document type must be valid
 * - Updates completion percentage
 * - Creates audit log
 */
async function uploadDocument(requestId, documentType, file, actorIp = null) {
  // Verify request exists and is not expired or completed
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status === REQUEST_STATUS.EXPIRED) {
    throw new Error('Cannot upload documents to expired request');
  }

  if (request.status === REQUEST_STATUS.COMPLETED) {
    throw new Error('Cannot upload documents to completed request');
  }

  // Also block if already approved (even if status hasn't changed yet)
  if (request.reviewStatus === 'APPROVED') {
    throw new Error('Cannot upload documents to approved request');
  }

  // Validate document type
  const { DOCUMENT_TYPES } = require('../models/request');
  if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
    throw new Error('Invalid document type');
  }

  // Upload file to Firebase Storage
  // Explicitly specify bucket name to avoid errors
  const bucketName = 'customer-request-tracking.firebasestorage.app';
  const bucket = storage.bucket(bucketName);
  const fileName = `requests/${requestId}/${documentType}/${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  // Upload the file
  await new Promise((resolve, reject) => {
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(file.buffer);
  });

  // Make file publicly readable (or use signed URLs in production)
  await fileUpload.makePublic();

  // Delete old documents of the same type (if any) to allow re-upload
  const existingDoc = await documentRepository.getDocumentByType(requestId, documentType);
  if (existingDoc && existingDoc.id) {
    // Delete old file from Storage
    try {
      if (existingDoc.storagePath) {
        const oldFile = bucket.file(existingDoc.storagePath);
        await oldFile.delete().catch(() => {
          // Ignore errors if file doesn't exist
        });
      }
    } catch (err) {
      console.warn('Could not delete old file:', err);
    }
    
    // Delete old document record
    const { db } = require('../firebase');
    await db.collection('documents').doc(existingDoc.id).delete();
  }

  // Create new document record
  const document = await documentRepository.createDocument({
    requestId: requestId,
    type: documentType,
    storagePath: fileName,
    checksum: null // Could calculate MD5/SHA256 hash here
  });

  // Update completion percentage
  const completionPercent = await documentRepository.calculateCompletionPercent(requestId);
  await requestRepository.updateRequest(requestId, {
    completionPercent: completionPercent
  });

  // Create audit log
  await auditLogRepository.createAuditLog({
    actorId: 'customer', // Customer uploads don't have a user ID
    action: 'CUSTOMER_UPLOADED_DOCUMENT',
    requestId: requestId,
    ip: actorIp,
    metadata: {
      documentType: documentType
    }
  });

  return document;
}

/**
 * Submit request (customer action)
 * 
 * Business rules:
 * - All required documents must be uploaded (100%)
 * - Request must not be EXPIRED
 * - Sets status to SUBMITTED
 * - Sets reviewStatus to PENDING
 */
async function submitRequest(requestId, actorIp = null) {
  const request = await requestRepository.getRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status === REQUEST_STATUS.EXPIRED) {
    throw new Error('Cannot submit expired request');
  }

  if (request.status === REQUEST_STATUS.COMPLETED) {
    throw new Error('Cannot submit completed request');
  }

  // Also block if already approved
  if (request.reviewStatus === 'APPROVED') {
    throw new Error('Cannot submit approved request');
  }

  // Check if all documents are uploaded
  const allUploaded = await documentRepository.areAllDocumentsUploaded(requestId);
  if (!allUploaded) {
    throw new Error('All required documents must be uploaded before submission');
  }

  // Update request
  await requestRepository.updateRequest(requestId, {
    status: REQUEST_STATUS.SUBMITTED,
    completionPercent: 100,
    reviewStatus: 'PENDING'
  });

  // Create audit log
  await auditLogRepository.createAuditLog({
    actorId: 'customer',
    action: 'CUSTOMER_SUBMITTED',
    requestId: requestId,
    ip: actorIp
  });

  return await requestRepository.getRequestById(requestId);
}

module.exports = {
  uploadDocument,
  submitRequest
};

