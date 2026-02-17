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
  const [recentlyUploaded, setRecentlyUploaded] = useState(new Set());

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
      setRecentlyUploaded(prev => new Set(prev).add(documentType));
      // Reload request to get updated status
      await loadRequest();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading({ ...uploading, [documentType]: false });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await publicFetch(`/api/customer/requests/${request.id}/submit`, {
        method: 'POST'
      });
      setRecentlyUploaded(new Set());
      await loadRequest();
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6c757d', fontSize: '16px' }}>Loading your request...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '420px', width: '100%' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
          <h2 style={{ margin: '0 0 8px', color: '#343a40' }}>Request Not Found</h2>
          <p style={{ margin: 0, color: '#6c757d' }}>{error || 'The request link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const allDocumentsUploaded = Object.values(documentStatus).every(Boolean);
  // After rejection, the customer must re-upload ALL flagged documents before resubmitting
  const allRejectedDocsReuploaded = request.reviewStatus !== 'REJECTED' ||
    (request.rejectedDocumentTypes || []).every(docType => recentlyUploaded.has(docType));
  const canSubmit = allDocumentsUploaded && allRejectedDocsReuploaded;
  // Make read-only if expired, completed, or already approved
  const isReadOnly = request.isReadOnly ||
                     request.status === 'EXPIRED' ||
                     request.status === 'COMPLETED' ||
                     request.status === 'SUBMITTED' ||
                     request.reviewStatus === 'APPROVED';

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px 16px' }}>
    <div style={{
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '26px', color: '#343a40' }}>Document Upload Portal</h1>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '15px' }}>Upload your documents securely. You can return to this page any time using the same link.</p>
      </div>

      {request.status === 'EXPIRED' && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          marginBottom: '16px',
          borderLeft: '4px solid #dc3545',
          fontSize: '15px'
        }}>
          <strong>Your request has expired.</strong> Please contact your sales agent for assistance.
        </div>
      )}

      {request.status === 'SUBMITTED' && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          borderRadius: '8px',
          marginBottom: '16px',
          borderLeft: '4px solid #17a2b8',
          fontSize: '15px'
        }}>
          <strong>Your documents have been submitted successfully.</strong>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            Our sales team is reviewing your documents and will be in touch with you shortly.
          </p>
        </div>
      )}

      {request.status === 'COMPLETED' && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '8px',
          marginBottom: '16px',
          borderLeft: '4px solid #28a745',
          fontSize: '15px'
        }}>
          <strong>Your request has been completed!</strong> Thank you for your submission.
        </div>
      )}

      <ReviewStatusBanner
        reviewStatus={request.reviewStatus}
        reviewComment={request.reviewComment}
      />

      <div style={{
        backgroundColor: '#fff',
        padding: '20px 24px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Request Information</p>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#6c757d' }}>Customer Name</p>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '15px', color: '#343a40' }}>{request.customerName}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#6c757d' }}>Status</p>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '15px', color: '#343a40' }}>{request.status.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#6c757d' }}>Completion</p>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '15px', color: '#343a40' }}>{request.completionPercent}%</p>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '20px 24px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Required Documents</p>
        <p style={{ color: '#6c757d', fontSize: '14px', margin: '0 0 16px' }}>
          Please upload all required documents. Accepted formats: JPG, PNG, PDF.
        </p>

        {Object.values(DOCUMENT_TYPES).map((docType) => {
          const isUploaded = documentStatus[docType];
          const isUploading = uploading[docType];
          // Find the uploaded document for this type
          const uploadedDoc = documents.find(doc => doc.type === docType);

          // Per-document rejection logic
          const isRejectedDoc = request.reviewStatus === 'REJECTED' &&
                                request.rejectedDocumentTypes?.includes(docType);
          const isAcceptedDoc = request.reviewStatus === 'REJECTED' &&
                                request.rejectedDocumentTypes?.length > 0 &&
                                !request.rejectedDocumentTypes?.includes(docType);

          // This doc is read-only if globally read-only OR it was accepted (not flagged for re-upload)
          const isDocReadOnly = isReadOnly || isAcceptedDoc;

          const getDocumentUrl = (doc) => {
            // Use backend proxy — streams via Admin SDK, always has access
            return `/api/customer/requests/${token}/files/${doc.id}`;
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
                padding: '16px',
                border: isRejectedDoc ? '2px solid #dc3545' : '1px solid #dee2e6',
                borderRadius: '8px',
                marginBottom: '12px',
                backgroundColor: isAcceptedDoc ? '#f0fff4' : isUploaded ? '#f0fff4' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isUploaded ? '10px' : '0' }}>
                <div>
                  <strong>{docType.replace(/_/g, ' ')}</strong>
                  {isUploaded && !isRejectedDoc && (
                    <span style={{ marginLeft: '10px', color: '#28a745' }}>✓ Uploaded</span>
                  )}
                  {isRejectedDoc && (
                    <span style={{ marginLeft: '10px', color: '#dc3545', fontWeight: 'bold' }}>⚠ Action required</span>
                  )}
                  {isAcceptedDoc && (
                    <span style={{ marginLeft: '10px', color: '#28a745' }}>✓ Accepted</span>
                  )}
                </div>
                {!isDocReadOnly && (
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
                        backgroundColor: isRejectedDoc ? '#dc3545' : isUploaded ? '#ffc107' : '#007bff',
                        color: (isRejectedDoc || !isUploaded) ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        opacity: isUploading ? 0.6 : 1,
                        marginLeft: '10px'
                      }}
                    >
                      {isUploading ? 'Uploading...' : isRejectedDoc ? 'Re-upload Required' : isUploaded ? 'Re-upload' : 'Upload'}
                    </label>
                  </div>
                )}
              </div>
              {isUploaded && uploadedDoc && (
                (request.status !== 'SUBMITTED' && !isAcceptedDoc && request.reviewStatus !== 'REJECTED') ||
                recentlyUploaded.has(docType)
              ) && (
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
                            src={getDocumentUrl(uploadedDoc)}
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
                              const docUrl = getDocumentUrl(uploadedDoc);
                              
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
                        href={getDocumentUrl(uploadedDoc)}
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
              {isUploaded && request.status === 'SUBMITTED' && !recentlyUploaded.has(docType) && (
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
              {isUploaded && isAcceptedDoc && !recentlyUploaded.has(docType) && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#155724',
                  border: '1px solid #c3e6cb'
                }}>
                  <p style={{ margin: '0' }}>
                    ✓ This document was accepted. No action needed.
                  </p>
                </div>
              )}
              {isUploaded && isRejectedDoc && !recentlyUploaded.has(docType) && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8d7da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#721c24',
                  border: '1px solid #f5c6cb'
                }}>
                  <p style={{ margin: '0' }}>
                    ✗ This document needs to be re-uploaded. Please use the button above.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isReadOnly && (
        <div style={{
          backgroundColor: '#fff',
          padding: '20px 24px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting || request.status === 'SUBMITTED'}
            style={{
              padding: '13px 44px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: canSubmit ? '#28a745' : '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: (canSubmit && !submitting) ? 'pointer' : 'not-allowed',
              opacity: (canSubmit && !submitting) ? 1 : 0.6
            }}
          >
            {submitting ? 'Submitting...' : request.reviewStatus === 'REJECTED' ? 'Resubmit Request' : 'Submit Request'}
          </button>
          {!allDocumentsUploaded && (
            <p style={{ marginTop: '10px', color: '#6c757d', fontSize: '14px', margin: '10px 0 0' }}>
              Please upload all required documents before submitting.
            </p>
          )}
          {allDocumentsUploaded && !allRejectedDocsReuploaded && (
            <p style={{ marginTop: '10px', color: '#dc3545', fontSize: '14px', margin: '10px 0 0' }}>
              Please re-upload the flagged documents before resubmitting.
            </p>
          )}
        </div>
      )}
    </div>
    </div>
  );
}

export default CustomerPortal;

