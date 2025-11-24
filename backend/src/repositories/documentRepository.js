/**
 * Document Repository
 * 
 * Handles all Firestore operations for the 'documents' collection
 */

const { db } = require('../firebase');
const { DOCUMENT_TYPES } = require('../models/request');

/**
 * Create a new document entry
 */
async function createDocument(documentData) {
  const docRef = db.collection('documents').doc();
  const docId = docRef.id;
  
  await docRef.set({
    id: docId,
    requestId: documentData.requestId,
    type: documentData.type,
    storagePath: documentData.storagePath,
    uploadedAt: new Date(),
    checksum: documentData.checksum || null
  });
  
  return {
    id: docId,
    ...documentData,
    uploadedAt: new Date()
  };
}

/**
 * Get all documents for a request
 */
async function getDocumentsByRequestId(requestId) {
  const snapshot = await db.collection('documents')
    .where('requestId', '==', requestId)
    .orderBy('uploadedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Get document by type for a request
 */
async function getDocumentByType(requestId, documentType) {
  const snapshot = await db.collection('documents')
    .where('requestId', '==', requestId)
    .where('type', '==', documentType)
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
 * Check which required document types are uploaded for a request
 * Returns an object with document type as key and boolean as value
 */
async function getDocumentUploadStatus(requestId) {
  const documents = await getDocumentsByRequestId(requestId);
  const uploadedTypes = new Set(documents.map(doc => doc.type));
  
  const status = {};
  Object.values(DOCUMENT_TYPES).forEach(type => {
    status[type] = uploadedTypes.has(type);
  });
  
  return status;
}

/**
 * Calculate completion percentage based on uploaded documents
 */
async function calculateCompletionPercent(requestId) {
  const status = await getDocumentUploadStatus(requestId);
  const requiredTypes = Object.values(DOCUMENT_TYPES);
  const uploadedCount = Object.values(status).filter(Boolean).length;
  
  return Math.round((uploadedCount / requiredTypes.length) * 100);
}

/**
 * Check if all required documents are uploaded
 */
async function areAllDocumentsUploaded(requestId) {
  const status = await getDocumentUploadStatus(requestId);
  return Object.values(status).every(Boolean);
}

module.exports = {
  createDocument,
  getDocumentsByRequestId,
  getDocumentByType,
  getDocumentUploadStatus,
  calculateCompletionPercent,
  areAllDocumentsUploaded
};

