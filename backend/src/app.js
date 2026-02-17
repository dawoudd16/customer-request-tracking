/**
 * Express Application Setup
 * 
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const customerRoutes = require('./routes/customerRoutes');
const telesalesRoutes = require('./routes/telesalesRoutes');
const managerRoutes = require('./routes/managerRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const { verifyFirebaseToken } = require('./authMiddleware');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses (important for audit logs)
app.set('trust proxy', true);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Shared auth endpoint — returns current user's role (used by login page for redirect)
app.get('/api/auth/me', verifyFirebaseToken, (req, res) => {
  res.json({ user: { id: req.user.uid, email: req.user.email, role: req.user.role, name: req.user.name } });
});

// API Routes
app.use('/api/customer', customerRoutes);
app.use('/api/telesales', telesalesRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/partner', partnerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error', 
    message: err.message || 'An unexpected error occurred' 
  });
});

module.exports = app;

