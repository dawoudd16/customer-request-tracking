/**
 * User Repository
 * 
 * Handles all Firestore operations for the 'users' collection
 */

const { db } = require('../firebase');

/**
 * Create a new user document
 */
async function createUser(userData) {
  const userRef = db.collection('users').doc(userData.id);
  await userRef.set({
    name: userData.name,
    email: userData.email,
    phone: userData.phone || null,
    role: userData.role, // 'agent', 'manager', or 'customer'
    createdAt: new Date()
  });
  return userRef.id;
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }
  return {
    id: userDoc.id,
    ...userDoc.data()
  };
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const snapshot = await db.collection('users')
    .where('email', '==', email)
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
 * Find or create customer user by phone/email
 * Returns existing customer or creates a new one
 */
async function findOrCreateCustomer(customerData) {
  // Try to find by phone first
  if (customerData.phone) {
    const phoneSnapshot = await db.collection('users')
      .where('phone', '==', customerData.phone)
      .where('role', '==', 'customer')
      .limit(1)
      .get();
    
    if (!phoneSnapshot.empty) {
      const doc = phoneSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
  }

  // Try to find by email if provided
  if (customerData.email) {
    const emailSnapshot = await db.collection('users')
      .where('email', '==', customerData.email)
      .where('role', '==', 'customer')
      .limit(1)
      .get();
    
    if (!emailSnapshot.empty) {
      const doc = emailSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
  }

  // Create new customer user
  // Note: In a real system, you might want to create the Firebase Auth user first
  // For now, we'll create just the Firestore document
  const customerId = db.collection('users').doc().id;
  await createUser({
    id: customerId,
    name: customerData.name,
    email: customerData.email || null,
    phone: customerData.phone,
    role: 'customer'
  });

  return {
    id: customerId,
    name: customerData.name,
    email: customerData.email || null,
    phone: customerData.phone,
    role: 'customer'
  };
}

/**
 * Get all users with a specific role
 */
async function getUsersByRole(role) {
  const snapshot = await db.collection('users')
    .where('role', '==', role)
    .get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  findOrCreateCustomer,
  getUsersByRole
};

