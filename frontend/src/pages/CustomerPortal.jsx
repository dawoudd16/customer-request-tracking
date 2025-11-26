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
  // Make read-only if expired, completed, or already approved
  const isReadOnly = request.isReadOnly || 
                     request.status === 'EXPIRED' || 
                     request.status === 'COMPLETED' || 
                     request.reviewStatus === 'APPROVED';

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

      {request.status === 'COMPLETED' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>✓ Your request has been completed!</strong> Thank you for your submission.
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
          // Find the uploaded document for this type
          const uploadedDoc = documents.find(doc => doc.type === docType);

          const getDocumentUrl = (storagePath) => {
            const bucketName = 'customer-request-tracking.firebasestorage.app';
            return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isUploaded ? '10px' : '0' }}>
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
                          // Reset the input so the same file can be selected again
                          e.target.value = '';
                        }
                      }}
                      disabled={isUploading}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor={`file-${docType}`}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isUploaded ? '#ffc107' : '#007bff',
                        color: isUploaded ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        opacity: isUploading ? 0.6 : 1,
                        marginLeft: '10px'
                      }}
                    >
                      {isUploading ? 'Uploading...' : isUploaded ? 'Re-upload' : 'Upload'}
                    </label>
                  </div>
                )}
              </div>
              {isUploaded && uploadedDoc && request.status !== 'SUBMITTED' && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0', color: '#6c757d', fontSize: '12px' }}>
                      Uploaded: {formatDate(uploadedDoc.uploadedAt)}
                    </p>
                  </div>
                  {uploadedDoc.storagePath && (
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
                            src={getDocumentUrl(uploadedDoc.storagePath)}
                            alt={docType}
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
                              const docUrl = getDocumentUrl(uploadedDoc.storagePath);
                              
                              // Check if it's a PDF or other file type
                              const iframe = document.createElement('iframe');
                              iframe.src = docUrl;
                              iframe.style.cssText = 'width: 100%; height: 500px; border: none; border-radius: 4px;';
                              iframe.title = docType;
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
                        href={getDocumentUrl(uploadedDoc.storagePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        Open in New Tab
                      </a>
                    </div>
                  )}
                </div>
              )}
              {isUploaded && request.status === 'SUBMITTED' && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#856404',
                  border: '1px solid #ffeaa7'
                }}>
                  <p style={{ margin: '0' }}>
                    ✓ Document uploaded and submitted. Files are no longer visible for security purposes.
                  </p>
                </div>
              )}
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
            {submitting ? 'Submitting...' : request.reviewStatus === 'REJECTED' ? 'Resubmit Request' : 'Submit Request'}
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

