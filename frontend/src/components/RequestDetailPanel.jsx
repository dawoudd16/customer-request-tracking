/**
 * Request Detail Panel Component
 * 
 * Shows detailed information about a request including:
 * - Request info
 * - Uploaded documents
 * - Notes
 * - Actions (update status, remind, reopen, review)
 */

import React, { useState } from 'react';
import { authenticatedFetch } from '../utils/api';
import ReminderBadge from './ReminderBadge';

/**
 * @param {Object} request - Request object with full details
 * @param {Function} onUpdate - Callback when request is updated
 */
function RequestDetailPanel({ request, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setError(null);
    try {
      await authenticatedFetch(`/api/telesales/requests/${request.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderConfirmed = async () => {
    setLoading(true);
    setError(null);
    try {
      await authenticatedFetch(`/api/telesales/requests/${request.id}/reminded`, {
        method: 'POST'
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    setLoading(true);
    setError(null);
    try {
      await authenticatedFetch(`/api/telesales/requests/${request.id}/reopen`, {
        method: 'POST'
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewDecision) {
      setError('Please select Approve or Reject');
      return;
    }
    if (reviewDecision === 'REJECT' && !reviewComment) {
      setError('Comment is required for rejection');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authenticatedFetch(`/api/telesales/requests/${request.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision: reviewDecision,
          comment: reviewComment
        })
      });
      setReviewDecision('');
      setReviewComment('');
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      backgroundColor: '#fff',
      maxWidth: '800px',
      margin: '20px auto'
    }}>
      <h2>Request Details</h2>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> {request.customerName}</p>
        <p><strong>Phone:</strong> {request.customerPhone}</p>
        {request.customerEmail && <p><strong>Email:</strong> {request.customerEmail}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Request Information</h3>
        <p><strong>Status:</strong> {request.status}</p>
        <p><strong>Completion:</strong> {request.completionPercent}%</p>
        <p><strong>Created:</strong> {formatDate(request.createdAt)}</p>
        <p><strong>Reminder:</strong> <ReminderBadge needsReminderLevel={request.needsReminderLevel || 0} /></p>
        <p><strong>Review Status:</strong> {request.reviewStatus || 'PENDING'}</p>
        {request.reviewComment && (
          <p><strong>Review Comment:</strong> {request.reviewComment}</p>
        )}
      </div>

      {request.documents && request.documents.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Uploaded Documents</h3>
          <ul>
            {request.documents.map((doc) => (
              <li key={doc.id}>
                {doc.type} - Uploaded: {formatDate(doc.uploadedAt)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {request.notes && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Notes</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{request.notes}</p>
        </div>
      )}

      <div style={{ marginTop: '30px', borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
        <h3>Actions</h3>

        {request.status === 'EXPIRED' ? (
          <button
            onClick={handleReopen}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            Reopen Request
          </button>
        ) : (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Change Status:</label>
              <select
                value={request.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                style={{
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  marginRight: '10px'
                }}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            {(request.needsReminderLevel === 1 || request.needsReminderLevel === 2) && (
              <button
                onClick={handleReminderConfirmed}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '15px',
                  display: 'block'
                }}
              >
                I Reminded the Customer
              </button>
            )}

            {request.status === 'SUBMITTED' && request.reviewStatus === 'PENDING' && (
              <div style={{
                border: '1px solid #dee2e6',
                padding: '15px',
                borderRadius: '4px',
                marginTop: '20px'
              }}>
                <h4>Review Request</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ marginRight: '10px' }}>
                    <input
                      type="radio"
                      name="reviewDecision"
                      value="APPROVE"
                      checked={reviewDecision === 'APPROVE'}
                      onChange={(e) => setReviewDecision(e.target.value)}
                    />
                    Approve
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="reviewDecision"
                      value="REJECT"
                      checked={reviewDecision === 'REJECT'}
                      onChange={(e) => setReviewDecision(e.target.value)}
                    />
                    Reject
                  </label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Comment {reviewDecision === 'REJECT' && <span style={{ color: 'red' }}>*</span>}
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <button
                  onClick={handleReview}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Submit Review
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RequestDetailPanel;

