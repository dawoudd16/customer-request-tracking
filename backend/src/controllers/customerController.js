/**
 * Customer Controller
 * 
 * Handles HTTP requests for customer-facing endpoints
 * Customers access via secure tokens (no Firebase Auth required)
 */

const requestRepository = require('../repositories/requestRepository');
const documentRepository = require('../repositories/documentRepository');
const documentService = require('../services/documentService');
const { DOCUMENT_TYPES, REQUEST_STATUS } = require('../models/request');
const { storage } = require('../firebase');

/**
 * Get customer request by secure token
 * GET /api/customer/requests/:token
 */
async function getRequestByToken(req, res) {
  try {
    const { token } = req.params;
    
    const request = await requestRepository.getRequestByToken(token);
    if (!request) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Request not found or invalid token' 
      });
    }

    // Get documents and upload status
    const documents = await documentRepository.getDocumentsByRequestId(request.id);
    const documentStatus = await documentRepository.getDocumentUploadStatus(request.id);

    // Determine if request is read-only (expired)
    const isReadOnly = request.status === REQUEST_STATUS.EXPIRED;

    res.json({
      request: {
        id: request.id,
        customerName: request.customerName,
        status: request.status,
        completionPercent: request.completionPercent,
        reviewStatus: request.reviewStatus,
        reviewComment: request.reviewComment,
        rejectedDocumentTypes: request.rejectedDocumentTypes || [],
        expiredAt: request.expiredAt,
        isReadOnly
      },
      documents,
      documentStatus,
      requiredDocumentTypes: Object.values(DOCUMENT_TYPES)
    });
  } catch (error) {
    console.error('Error getting customer request:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}

/**
 * Upload document
 * POST /api/customer/requests/:id/documents
 */
async function uploadDocument(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'No file uploaded' 
      });
    }

    if (!type) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Document type is required' 
      });
    }

    const actorIp = req.ip || req.connection.remoteAddress;
    const document = await documentService.uploadDocument(id, type, file, actorIp);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
}

/**
 * Submit request
 * POST /api/customer/requests/:id/submit
 */
async function submitRequest(req, res) {
  try {
    const { id } = req.params;
    const actorIp = req.ip || req.connection.remoteAddress;

    const request = await documentService.submitRequest(id, actorIp);

    res.json({
      message: 'Request submitted successfully',
      request: {
        id: request.id,
        status: request.status,
        reviewStatus: request.reviewStatus
      }
    });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
}

/**
 * Stream a document file back to the client
 * GET /api/customer/requests/:token/files/:docId
 */
async function streamDocument(req, res) {
  try {
    const { token, docId } = req.params;

    // Verify the token belongs to a real request
    const request = await requestRepository.getRequestByToken(token);
    if (!request) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Find the document and make sure it belongs to this request
    const doc = await documentRepository.getDocumentById(docId);
    if (!doc || doc.requestId !== request.id) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Stream the file from Firebase Storage using Admin SDK (always has access)
    const bucket = storage.bucket();
    const file = bucket.file(doc.storagePath);

    const [metadata] = await file.getMetadata();
    res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    file.createReadStream()
      .on('error', () => res.status(500).end())
      .pipe(res);
  } catch (error) {
    console.error('Error streaming document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getRequestByToken,
  uploadDocument,
  submitRequest,
  streamDocument
};

