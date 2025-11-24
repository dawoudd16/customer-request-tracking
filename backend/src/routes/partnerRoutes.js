/**
 * Partner Routes (External API)
 * 
 * Read-only endpoints for external systems (CRM/DMS)
 * Version 1: Stubbed
 * Version 2: Add API key authentication
 */

const express = require('express');
const requestRepository = require('../repositories/requestRepository');

const router = express.Router();

/**
 * Get request status by ID (read-only)
 * GET /api/partner/requests/:id/status
 * 
 * Version 1: Basic implementation
 * Version 2: Add API key authentication, rate limiting
 */
router.get('/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await requestRepository.getRequestById(id);
    if (!request) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Request not found' 
      });
    }

    // Return minimal status information
    res.json({
      id: request.id,
      status: request.status,
      completionPercent: request.completionPercent,
      createdAt: request.createdAt,
      expiredAt: request.expiredAt
    });
  } catch (error) {
    console.error('Error getting request status:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

module.exports = router;

