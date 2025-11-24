/**
 * Customer Portal Page
 * 
 * Public page accessed via secure token: /customer/:token
 * Customers can:
 * - View their request status
 * - Upload required documents
 * - Submit request when all documents are uploaded
 * - View review feedback
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicFetch, uploadFile } from '../utils/api';
import ReviewStatusBanner from '../components/ReviewStatusBanner';

// Required document types
const DOCUMENT_TYPES = {
  ID: 'ID',
  LICENCE: 'LICENCE',
  PROOF_OF_ADDRESS: 'PROOF_OF_ADDRESS',
  BANK_STATEMENT: 'BANK_STATEMENT'
};

function CustomerPortal() {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentStatus, setDocumentStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [token]);

  const loadRequest = async () => {
    try {
      const data = await publicFetch(`/api/customer/requests/${token}`);
      setRequest(data.request);
      setDocuments(data.documents || []);
      setDocumentStatus(data.documentStatus || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    setUploading({ ...uploading, [documentType]: true });
    try {
      await uploadFile(`/api/customer/requests/${request.id}/documents`, file, documentType);
      // Reload request to get updated status
      await loadRequest();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading({ ...uploading, [documentType]: false });
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? You will not be able to upload more documents after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      await publicFetch(`/api/customer/requests/${request.id}/submit`, {
        method: 'POST'
      });
      await loadRequest();
      alert('Request submitted successfully!');
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Request Not Found</h2>
        <p>{error || 'The request link is invalid or has expired.'}</p>
      </div>
    );
  }

  const allDocumentsUploaded = Object.values(documentStatus).every(Boolean);
  const isReadOnly = request.isReadOnly || request.status === 'EXPIRED';

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1>Customer Request Portal</h1>

      {request.status === 'EXPIRED' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Your request has expired.</strong> Please contact your sales agent for assistance.
        </div>
      )}

      <ReviewStatusBanner
        reviewStatus={request.reviewStatus}
        reviewComment={request.reviewComment}
      />

      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Request Information</h2>
        <p><strong>Customer Name:</strong> {request.customerName}</p>
        <p><strong>Status:</strong> {request.status}</p>
        <p><strong>Completion:</strong> {request.completionPercent}%</p>
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Required Documents</h2>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          Please upload all required documents. You can leave and come back later using the same link.
        </p>

        {Object.values(DOCUMENT_TYPES).map((docType) => {
          const isUploaded = documentStatus[docType];
          const isUploading = uploading[docType];

          return (
            <div
              key={docType}
              style={{
                padding: '15px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                marginBottom: '10px',
                backgroundColor: isUploaded ? '#d4edda' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{docType.replace(/_/g, ' ')}</strong>
                  {isUploaded && (
                    <span style={{ marginLeft: '10px', color: '#28a745' }}>✓ Uploaded</span>
                  )}
                </div>
                {!isReadOnly && (
                  <div>
                    <input
                      type="file"
                      id={`file-${docType}`}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleFileUpload(docType, file);
                        }
                      }}
                      disabled={isUploading || isUploaded}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor={`file-${docType}`}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isUploaded ? '#6c757d' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (isUploading || isUploaded) ? 'not-allowed' : 'pointer',
                        opacity: (isUploading || isUploaded) ? 0.6 : 1
                      }}
                    >
                      {isUploading ? 'Uploading...' : isUploaded ? 'Re-upload' : 'Upload'}
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isReadOnly && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={handleSubmit}
            disabled={!allDocumentsUploaded || submitting || request.status === 'SUBMITTED'}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: allDocumentsUploaded ? '#28a745' : '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: (allDocumentsUploaded && !submitting) ? 'pointer' : 'not-allowed',
              opacity: (allDocumentsUploaded && !submitting) ? 1 : 0.6
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          {!allDocumentsUploaded && (
            <p style={{ marginTop: '10px', color: '#6c757d' }}>
              Please upload all required documents before submitting.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerPortal;

