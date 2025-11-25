/**
 * Request Detail Panel Component
 * 
 * Shows detailed information about a request including:
 * - Request info
 * - Uploaded documents
 * - Notes
 * - Actions (update status, remind, reopen, review)
 */

import React, { useState, useEffect } from 'react';
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
  const [notes, setNotes] = useState(request.notes || '');
  const [currentRequest, setCurrentRequest] = useState(request);

  // Sync request prop with state when it changes
  useEffect(() => {
    setCurrentRequest(request);
    setNotes(request.notes || '');
  }, [request]);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await authenticatedFetch(`/api/telesales/requests/${request.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      // Reload full request details instead of going back
      const details = await authenticatedFetch(`/api/telesales/requests/${request.id}`);
      setCurrentRequest(details.request);
      if (onUpdate) onUpdate(); // Still notify parent to refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      await authenticatedFetch(`/api/telesales/requests/${request.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: notes })
      });
      // Reload full request details
      const details = await authenticatedFetch(`/api/telesales/requests/${request.id}`);
      setCurrentRequest(details.request);
      setNotes(details.request.notes || '');
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
      // Reload full request details
      const details = await authenticatedFetch(`/api/telesales/requests/${request.id}`);
      setCurrentRequest(details.request);
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
      // Reload full request details
      const details = await authenticatedFetch(`/api/telesales/requests/${request.id}`);
      setCurrentRequest(details.request);
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
      // Reload full request details
      const details = await authenticatedFetch(`/api/telesales/requests/${request.id}`);
      setCurrentRequest(details.request);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  };

  const getDocumentUrl = (storagePath) => {
    // Construct Firebase Storage URL
    const bucketName = 'customer-request-tracking.firebasestorage.app';
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;
  };

  // Use currentRequest state instead of request prop
  const req = currentRequest;

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
        <p><strong>Name:</strong> {req.customerName}</p>
        <p><strong>Phone:</strong> {req.customerPhone}</p>
        {req.customerEmail && <p><strong>Email:</strong> {req.customerEmail}</p>}
        {req.dealerId && <p><strong>Dealer ID:</strong> {req.dealerId}</p>}
        {req.vehicleId && <p><strong>Vehicle ID:</strong> {req.vehicleId}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Request Information</h3>
        <p><strong>Status:</strong> {req.status}</p>
        <p><strong>Completion:</strong> {req.completionPercent}%</p>
        <p><strong>Created:</strong> {formatDate(req.createdAt)}</p>
        <p><strong>Reminder:</strong> <ReminderBadge needsReminderLevel={req.needsReminderLevel || 0} /></p>
        <p><strong>Review Status:</strong> {req.reviewStatus || 'PENDING'}</p>
        {req.reviewComment && (
          <p><strong>Review Comment:</strong> {req.reviewComment}</p>
        )}
      </div>

      {req.documents && req.documents.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Uploaded Documents</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {req.documents.map((doc) => (
              <div key={doc.id} style={{
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '15px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '16px' }}>{doc.type.replace(/_/g, ' ')}</p>
                  <p style={{ fontSize: '12px', color: '#6c757d', margin: '0' }}>
                    Uploaded: {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                {doc.storagePath && (
                  <div>
                    <div style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      padding: '10px',
                      backgroundColor: '#fff',
                      marginBottom: '10px',
                      textAlign: 'center',
                      minHeight: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '100%' }}>
                        {/* Try to show as image first */}
                        <img
                          src={getDocumentUrl(doc.storagePath)}
                          alt={doc.type}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'block',
                            margin: '0 auto'
                          }}
                          onError={(e) => {
                            // If image fails, try PDF viewer
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            const docUrl = getDocumentUrl(doc.storagePath);
                            
                            // Check if it's a PDF or other file type
                            const iframe = document.createElement('iframe');
                            iframe.src = docUrl;
                            iframe.style.cssText = 'width: 100%; height: 500px; border: none; border-radius: 4px;';
                            iframe.title = doc.type;
                            parent.appendChild(iframe);
                            
                            // Also add a fallback link
                            const fallback = document.createElement('div');
                            fallback.style.cssText = 'margin-top: 10px;';
                            const link = document.createElement('a');
                            link.href = docUrl;
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            link.style.cssText = 'display: inline-block; padding: 8px 16px; background-color: #6c757d; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;';
                            link.textContent = '📄 Download File';
                            fallback.appendChild(link);
                            parent.appendChild(fallback);
                          }}
                        />
                      </div>
                    </div>
                    <a
                      href={getDocumentUrl(doc.storagePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        textAlign: 'center'
                      }}
                    >
                      Open in New Tab
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
          placeholder="Add notes about this request..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleNotesUpdate}
          disabled={loading || notes === (req.notes || '')}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: notes === (req.notes || '') ? '#6c757d' : '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: notes === (req.notes || '') ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Saving...' : 'Save Notes'}
        </button>
      </div>

      <div style={{ marginTop: '30px', borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
        <h3>Actions</h3>

        {req.status === 'EXPIRED' ? (
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
                value={req.status}
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
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            {(req.needsReminderLevel === 1 || req.needsReminderLevel === 2) && (
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

            {req.status === 'SUBMITTED' && req.reviewStatus === 'PENDING' && (
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

            {req.status === 'SUBMITTED' && req.reviewStatus !== 'PENDING' && (
              <div style={{
                border: '1px solid #dee2e6',
                padding: '15px',
                borderRadius: '4px',
                marginTop: '20px',
                backgroundColor: req.reviewStatus === 'APPROVED' ? '#d4edda' : '#f8d7da'
              }}>
                <h4>Review Status: {req.reviewStatus}</h4>
                {req.reviewComment && (
                  <p><strong>Comment:</strong> {req.reviewComment}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RequestDetailPanel;

