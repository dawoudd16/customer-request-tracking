/**
 * Tele-Sales Routes
 * 
 * Protected routes for Tele-Sales agents
 * All routes require Firebase Auth via middleware
 */

const express = require('express');
const { verifyFirebaseToken, requireRole } = require('../authMiddleware');
const telesalesController = require('../controllers/telesalesController');

const router = express.Router();

// All routes require authentication and agent role
router.use(verifyFirebaseToken);
router.use(requireRole('agent'));

// POST /api/telesales/requests
router.post('/requests', telesalesController.createRequest);

// GET /api/telesales/requests
router.get('/requests', telesalesController.listRequests);

// GET /api/telesales/requests/:id
router.get('/requests/:id', telesalesController.getRequestDetails);

// PATCH /api/telesales/requests/:id
router.patch('/requests/:id', telesalesController.updateRequest);

// POST /api/telesales/requests/:id/reminded
router.post('/requests/:id/reminded', telesalesController.markReminderConfirmed);

// POST /api/telesales/requests/:id/reopen
router.post('/requests/:id/reopen', telesalesController.reopenRequest);

// POST /api/telesales/requests/:id/review
router.post('/requests/:id/review', telesalesController.reviewRequest);

// DELETE /api/telesales/requests/:id
router.delete('/requests/:id', telesalesController.deleteRequest);

module.exports = router;

