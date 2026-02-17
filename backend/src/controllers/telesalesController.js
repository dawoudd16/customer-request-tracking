/**
 * Tele-Sales Controller
 * 
 * Handles HTTP requests for Tele-Sales agent endpoints
 * All endpoints require Firebase Auth (via middleware)
 */

const requestService = require('../services/requestService');
const requestRepository = require('../repositories/requestRepository');
const documentRepository = require('../repositories/documentRepository');

/**
 * Create a new request
 * POST /api/telesales/requests
 */
async function createRequest(req, res) {
  try {
    const agentId = req.user.uid;
    const actorIp = req.ip || req.connection.remoteAddress;

    const { customerName, customerPhone, customerEmail, dealerId, vehicleId, notes } = req.body;

    // Validate required fields
    if (!customerName || !customerPhone) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'customerName and customerPhone are required' 
      });
    }

    const requestData = {
      customerName,
      customerPhone,
      customerEmail,
      dealerId,
      vehicleId,
      notes
    };

    const result = await requestService.createRequest(agentId, requestData, actorIp);

    res.status(201).json({
      message: 'Request created successfully',
      request: {
        id: result.id,
        customerName: result.customerName,
        status: result.status,
        secureToken: result.secureToken
      },
      customerLink: result.customerLink
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}

/**
 * List assigned requests
 * GET /api/telesales/requests
 */
async function listRequests(req, res) {
  try {
    const agentId = req.user.uid;
    const requests = await requestRepository.getRequestsByAgentId(agentId);

    // Enrich with document status for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const documentStatus = await documentRepository.getDocumentUploadStatus(request.id);
        return {
          ...request,
          documentStatus
        };
      })
    );

    res.json({
      requests: enrichedRequests
    });
  } catch (error) {
    console.error('Error listing requests:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}

/**
 * Get request details
 * GET /api/telesales/requests/:id
 */
async function getRequestDetails(req, res) {
  try {
    const { id } = req.params;
    const agentId = req.user.uid;

    const request = await requestRepository.getRequestById(id);
    if (!request) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Request not found' 
      });
    }

    // Verify agent owns this request
    if (request.agentId !== agentId) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have access to this request' 
      });
    }

    const details = await requestService.getRequestDetails(id);
    res.json({ request: details });
  } catch (error) {
    console.error('Error getting request details:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}

/**
 * Update request
 * PATCH /api/telesales/requests/:id
 */
async function updateRequest(req, res) {
  try {
    const { id } = req.params;
    const agentId = req.user.uid;
    const actorIp = req.ip || req.connection.remoteAddress;

    // Verify agent owns this request
    const currentRequest = await requestRepository.getRequestById(id);
    if (!currentRequest) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Request not found' 
      });
    }

    if (currentRequest.agentId !== agentId) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have access to this request' 
      });
    }

    const { status, notes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const updatedRequest = await requestService.updateRequest(id, updates, agentId, actorIp);

    res.json({
      message: 'Request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
}

/**
 * Mark reminder confirmed
 * POST /api/telesales/requests/:id/reminded
 */
async function markReminderConfirmed(req, res) {
  try {
    const { id } = req.params;
    const agentId = req.user.uid;
    const actorIp = req.ip || req.connection.remoteAddress;

    // Verify agent owns this request
    const currentRequest = await requestRepository.getRequestById(id);
    if (!currentRequest) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Request not found' 
      });
    }

    if (currentRequest.agentId !== agentId) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have access to this request' 
      });
    }

    const updatedRequest = await requestService.markReminderConfirmed(id, agentId, actorIp);

    res.json({
      message: 'Reminder confirmed',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error confirming reminder:', error);
    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
}

/**
 * Reopen expired request
 * POST /api/telesales/requests/:id/reopen
 */
async function reopenRequest(req, res) {
  try {
    const { id } = req.params;
    const agentId = req.user.uid;
    const actorIp = req.ip || req.connection.remoteAddress;

    // Verify agent owns this request
    const currentRequest = await requestRepository.getRequestById(id);
    if (!currentRequest) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Request not found' 
      });
    }

    if (currentRequest.agentId !== agentId) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have access to this request' 
      });
    }

    const updatedRequest = await requestService.reopenRequest(id, agentId, actorIp);

    res.json({
      message: 'Request reopened successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error reopening request:', error);
    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
}

/**
 * Review request (Approve/Reject)
 * POST /api/telesales/requests/:id/review
 */
async function reviewRequest(req, res) {
  try {
    const { id } = req.params;
    const agentId = req.user.uid;
    const actorIp = req.ip || req.connection.remoteAddress;
    const { decision, comment, rejectedDocumentTypes } = req.body;

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'decision must be APPROVE or REJECT'
      });
    }

    if (decision === 'REJECT' && !comment) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'comment is required for rejection'
      });
    }

    if (decision === 'REJECT' && (!rejectedDocumentTypes || rejectedDocumentTypes.length === 0)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one document must be selected for the customer to re-upload'
      });
    }

    // Verify agent owns this request
    const currentRequest = await requestRepository.getRequestById(id);
    if (!currentRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Request not found'
      });
    }

    if (currentRequest.agentId !== agentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this request'
      });
    }

    const updatedRequest = await requestService.reviewRequest(id, decision, comment, agentId, actorIp, rejectedDocumentTypes || []);

    res.json({
      message: `Request ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error reviewing request:', error);
    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
}

/**
 * Delete request
 * DELETE /api/telesales/requests/:id
 */
async function deleteRequest(req, res) {
  try {
    const { id } = req.params;
    const agentId = req.user.uid;
    const actorIp = req.ip || req.connection.remoteAddress;

    // Verify agent owns this request
    const currentRequest = await requestRepository.getRequestById(id);
    if (!currentRequest) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Request not found' 
      });
    }

    if (currentRequest.agentId !== agentId) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have permission to delete this request' 
      });
    }

    await requestService.deleteRequest(id, agentId, actorIp);

    res.json({
      message: 'Request deleted successfully',
      deletedRequestId: id
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(400).json({ 
      error: 'Bad Request', 
      message: error.message 
    });
  }
}

/**
 * Get current user profile
 * GET /api/telesales/me
 */
async function getCurrentUser(req, res) {
  try {
    // User info is already attached by authMiddleware
    res.json({
      user: {
        id: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}

module.exports = {
  createRequest,
  listRequests,
  getRequestDetails,
  updateRequest,
  markReminderConfirmed,
  reopenRequest,
  reviewRequest,
  deleteRequest,
  getCurrentUser
};

