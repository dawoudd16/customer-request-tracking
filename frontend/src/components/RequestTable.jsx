/**
 * Request Table Component
 * 
 * Displays a table of requests for Tele-Sales agents
 * Shows: customer name, status, completion, reminder badge, review status
 */

import React from 'react';
import ReminderBadge from './ReminderBadge';

/**
 * @param {Array} requests - Array of request objects
 * @param {Function} onRowClick - Callback when a row is clicked
 */
function RequestTable({ requests, onRowClick }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Customer Name</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Completion</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Created</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Reminder</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Review Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No requests found
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr
                key={request.id}
                onClick={() => onRowClick(request)}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid #dee2e6'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px' }}>{request.customerName}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: getStatusColor(request.status),
                    color: '#fff'
                  }}>
                    {request.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{request.completionPercent}%</td>
                <td style={{ padding: '12px' }}>{formatDate(request.createdAt)}</td>
                <td style={{ padding: '12px' }}>
                  <ReminderBadge needsReminderLevel={request.needsReminderLevel || 0} />
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: getReviewStatusColor(request.reviewStatus),
                    color: '#fff'
                  }}>
                    {request.reviewStatus || 'PENDING'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    'OPEN': '#007bff',
    'IN_PROGRESS': '#ffc107',
    'SUBMITTED': '#17a2b8',
    'COMPLETED': '#28a745',
    'EXPIRED': '#6c757d'
  };
  return colors[status] || '#6c757d';
}

function getReviewStatusColor(status) {
  const colors = {
    'PENDING': '#6c757d',
    'APPROVED': '#28a745',
    'REJECTED': '#dc3545'
  };
  return colors[status] || '#6c757d';
}

export default RequestTable;

