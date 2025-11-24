/**
 * Customer Routes
 * 
 * Public routes for customer access via secure tokens
 * No Firebase Auth required
 */

const express = require('express');
const multer = require('multer');
const customerController = require('../controllers/customerController');

const router = express.Router();

// Configure multer for file uploads (store in memory for Firebase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/customer/requests/:token
router.get('/requests/:token', customerController.getRequestByToken);

// POST /api/customer/requests/:id/documents
router.post('/requests/:id/documents', upload.single('file'), customerController.uploadDocument);

// POST /api/customer/requests/:id/submit
router.post('/requests/:id/submit', customerController.submitRequest);

module.exports = router;

