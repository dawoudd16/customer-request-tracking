/**
 * Create Request Form Component
 * 
 * Form for Tele-Sales agents to create new customer requests
 * Returns a secure customer link that can be sent via WhatsApp/email
 */

import React, { useState } from 'react';
import { authenticatedFetch } from '../utils/api';

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      // Don't call onSuccess immediately - let user see the success message first
      // onSuccess will be called when user clicks "Create Another" or goes back
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (createdLink) {
    return (
      <div style={{
        padding: '20px',
        border: '2px solid #28a745',
        borderRadius: '8px',
        backgroundColor: '#d4edda'
      }}>
        <h3 style={{ color: '#155724', marginTop: 0 }}>✓ Request Created Successfully!</h3>
        <p><strong>Customer Link:</strong></p>
        <div style={{
          backgroundColor: '#fff',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          wordBreak: 'break-all',
          fontFamily: 'monospace'
        }}>
          {window.location.origin}{createdLink}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}${createdLink}`);
            alert('Link copied to clipboard!');
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Copy Link
        </button>
        <button
          onClick={() => {
            setCreatedLink(null);
            setFormData({
              customerName: '',
              customerPhone: '',
              customerEmail: '',
              dealerId: '',
              vehicleId: '',
              notes: ''
            });
            // Call onSuccess when user wants to create another or go back
            if (onSuccess) {
              onSuccess();
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Another
        </button>
        <button
          onClick={() => {
            // Go back to list and reload requests
            if (onSuccess) {
              onSuccess();
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '20px 0' }}>
      <h2>Create New Request</h2>
      
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

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Customer Name <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Customer Phone <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="tel"
          name="customerPhone"
          value={formData.customerPhone}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Customer Email (Optional)
        </label>
        <input
          type="email"
          name="customerEmail"
          value={formData.customerEmail}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Dealer ID (Optional)
        </label>
        <input
          type="text"
          name="dealerId"
          value={formData.dealerId}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Vehicle ID (Optional)
        </label>
        <input
          type="text"
          name="vehicleId"
          value={formData.vehicleId}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Notes (Optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ced4da',
            borderRadius: '4px'
          }}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Creating...' : 'Create Request'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default CreateRequestForm;

