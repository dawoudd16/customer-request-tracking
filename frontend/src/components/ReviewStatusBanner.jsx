/**
 * Review Status Banner Component
 * 
 * Displays review feedback to customers:
 * - APPROVED: Green banner with optional comment
 * - REJECTED: Red banner with required comment
 */

import React from 'react';

/**
 * @param {string} reviewStatus - "PENDING", "APPROVED", or "REJECTED"
 * @param {string} reviewComment - Optional comment from reviewer
 */
function ReviewStatusBanner({ reviewStatus, reviewComment }) {
  if (reviewStatus === 'PENDING') {
    return null; // No banner for pending reviews
  }

  if (reviewStatus === 'APPROVED') {
    return (
      <div style={{
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        color: '#155724',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <strong>✓ Request Approved</strong>
        {reviewComment && (
          <p style={{ margin: '8px 0 0 0' }}>{reviewComment}</p>
        )}
      </div>
    );
  }

  if (reviewStatus === 'REJECTED') {
    return (
      <div style={{
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        color: '#721c24',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <strong>✗ Request Rejected</strong>
        {reviewComment && (
          <p style={{ margin: '8px 0 0 0' }}>{reviewComment}</p>
        )}
      </div>
    );
  }

  return null;
}

export default ReviewStatusBanner;

