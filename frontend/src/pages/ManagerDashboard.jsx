/**
 * Manager Dashboard Page
 * 
 * Version 1: Stub/placeholder for Manager features
 * Version 2: Full implementation with KPIs, filters, reassignment, audit logs
 */

import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseClient';
import { authenticatedFetch } from '../utils/api';

function ManagerDashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      const data = await authenticatedFetch('/api/manager/kpis');
      setKpis(data.kpis);
    } catch (err) {
      console.error('Error loading KPIs:', err);
      if (err.message.includes('Unauthorized') || err.message.includes('token')) {
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manager Dashboard</h1>
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

      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Key Performance Indicators</h2>
        <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
          Version 1: Basic KPI display. Full features coming in version 2.
        </p>

        {kpis && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{kpis.total}</div>
              <div style={{ color: '#6c757d' }}>Total Requests</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{kpis.open}</div>
              <div style={{ color: '#6c757d' }}>Open</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{kpis.submitted}</div>
              <div style={{ color: '#6c757d' }}>Submitted</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{kpis.approved}</div>
              <div style={{ color: '#6c757d' }}>Approved</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{kpis.rejected}</div>
              <div style={{ color: '#6c757d' }}>Rejected</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{kpis.expired}</div>
              <div style={{ color: '#6c757d' }}>Expired</div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Coming in Version 2</h2>
        <ul>
          <li>Advanced filtering and search</li>
          <li>Request reassignment</li>
          <li>Detailed audit logs</li>
          <li>Export functionality</li>
          <li>Analytics and reporting</li>
        </ul>
      </div>
    </div>
  );
}

export default ManagerDashboard;

