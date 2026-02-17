/**
 * Create Request Form Component
 *
 * Form for Tele-Sales agents to create new customer requests
 * Returns a secure customer link that can be sent via WhatsApp/email
 */

import React, { useState } from 'react';
import { authenticatedFetch } from '../utils/api';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ced4da',
  borderRadius: '6px',
  fontSize: '15px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s'
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: '600',
  fontSize: '14px',
  color: '#343a40'
};

const fieldStyle = { marginBottom: '18px' };

function Field({ label, required, children }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
        {!required && <span style={{ color: '#6c757d', fontWeight: '400', fontSize: '13px' }}> (optional)</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * @param {Function} onSuccess - Callback when request is created successfully
 * @param {Function} onCancel - Callback to cancel form
 */
function CreateRequestForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    dealerId: '',
    vehicleId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authenticatedFetch('/api/telesales/requests', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setCreatedLink(result.customerLink);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${createdLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateAnother = () => {
    setCreatedLink(null);
    setCopied(false);
    setFormData({ customerName: '', customerPhone: '', customerEmail: '', dealerId: '', vehicleId: '', notes: '' });
    setError(null);
  };

  if (createdLink) {
    return (
      <div style={{
        maxWidth: '600px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Success header */}
        <div style={{ backgroundColor: '#28a745', padding: '20px 24px' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Request Created Successfully</h3>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
            Share the link below with the customer to begin document upload.
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Customer Link</p>
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            padding: '12px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#495057'
          }}>
            {window.location.origin}{createdLink}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '10px 20px',
                backgroundColor: copied ? '#28a745' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleCreateAnother}
              style={{
                padding: '10px 20px',
                backgroundColor: '#fff',
                color: '#343a40',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Create Another
            </button>
            <button
              onClick={() => onSuccess && onSuccess()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#fff',
                color: '#6c757d',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Form header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #dee2e6' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#343a40' }}>Create New Request</h2>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6c757d' }}>
          Fill in the customer details to generate a document upload link.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        {error && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <Field label="Customer Name" required>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            placeholder="e.g. Ahmed Al-Rashid"
            style={inputStyle}
          />
        </Field>

        <Field label="Customer Phone" required>
          <input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            required
            placeholder="e.g. +971 50 123 4567"
            style={inputStyle}
          />
        </Field>

        <Field label="Customer Email">
          <input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            placeholder="e.g. ahmed@example.com"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Customer ID">
            <input
              type="text"
              name="dealerId"
              value={formData.dealerId}
              onChange={handleChange}
              placeholder="e.g. CUST-001"
              style={inputStyle}
            />
          </Field>
          <Field label="Vehicle ID">
            <input
              type="text"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              placeholder="e.g. VEH-2024"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional notes about this request..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px 24px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating...' : 'Create Request'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '11px 24px',
                backgroundColor: '#fff',
                color: '#6c757d',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CreateRequestForm;
