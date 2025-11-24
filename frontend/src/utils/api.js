/**
 * API Utility Functions
 * 
 * Helper functions for making API calls to the backend
 */

import { auth } from '../firebaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get Firebase ID token for authenticated requests
 */
async function getIdToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

/**
 * Make an authenticated API request (for employees)
 */
export async function authenticatedFetch(url, options = {}) {
  const token = await getIdToken();
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an unauthenticated API request (for customers)
 */
export async function publicFetch(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a file (for customer document uploads)
 */
export async function uploadFile(url, file, documentType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', documentType);

  const response = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

