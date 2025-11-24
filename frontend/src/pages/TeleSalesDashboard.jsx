/**
 * Tele-Sales Dashboard Page
 * 
 * Main dashboard for Tele-Sales agents to:
 * - View their assigned requests
 * - Create new requests
 * - View and manage request details
 */

import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseClient';
import { authenticatedFetch } from '../utils/api';
import RequestTable from '../components/RequestTable';
import CreateRequestForm from '../components/CreateRequestForm';
import RequestDetailPanel from '../components/RequestDetailPanel';

function TeleSalesDashboard() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await authenticatedFetch('/api/telesales/requests');
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error loading requests:', err);
      if (err.message.includes('Unauthorized') || err.message.includes('token')) {
        // Token expired or invalid, redirect to login
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleRequestClick = async (request) => {
    try {
      const data = await authenticatedFetch(`/api/telesales/requests/${request.id}`);
      setSelectedRequest(data.request);
    } catch (err) {
      console.error('Error loading request details:', err);
      alert('Failed to load request details');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadRequests(); // Reload list
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
    loadRequests(); // Reload to get updated data
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleBackToList}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to List
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        <RequestDetailPanel request={selectedRequest} onUpdate={handleBackToList} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Tele-Sales Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {showCreateForm ? (
        <div>
          <button
            onClick={() => setShowCreateForm(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← Back to List
          </button>
          <CreateRequestForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              + Create New Request
            </button>
          </div>

          <RequestTable requests={requests} onRowClick={handleRequestClick} />
        </>
      )}
    </div>
  );
}

export default TeleSalesDashboard;

