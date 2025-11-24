/**
 * Authentication Middleware
 * 
 * This middleware verifies Firebase ID tokens sent by authenticated employees
 * (Tele-Sales agents and Managers).
 * 
 * Customers do NOT use this middleware - they access via secure tokens.
 */

const { admin, db } = require('./firebase');

/**
 * Middleware to verify Firebase ID token and attach user info to request
 * 
 * Expected header: Authorization: Bearer <firebase-id-token>
 * 
 * On success, attaches req.user = { uid, role, name, email, ... }
 */
async function verifyFirebaseToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Missing or invalid Authorization header' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user document from Firestore to get role and other info
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'User not found in database' 
      });
    }

    const userData = userDoc.data();

    // Attach user info to request object
    req.user = {
      uid,
      email: decodedToken.email,
      role: userData.role,
      name: userData.name,
      ...userData
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
}

/**
 * Middleware to check if user has a specific role
 * Usage: verifyFirebaseToken, requireRole('manager')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
}

module.exports = {
  verifyFirebaseToken,
  requireRole
};

