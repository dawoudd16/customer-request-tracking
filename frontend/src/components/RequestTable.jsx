/**
 * Request Table Component
 *
 * Displays a table of requests for Tele-Sales agents
 * Shows: customer name, status, completion, reminder badge, review status
 */

import React from 'react';
import ReminderBadge from './ReminderBadge';

const STATUS_COLORS = {
  OPEN:        { bg: '#d1ecf1', color: '#0c5460' },
  IN_PROGRESS: { bg: '#fff3cd', color: '#856404' },
  SUBMITTED:   { bg: '#cce5ff', color: '#004085' },
  COMPLETED:   { bg: '#d4edda', color: '#155724' },
  EXPIRED:     { bg: '#f8d7da', color: '#721c24' }
};

const REVIEW_COLORS = {
  PENDING:  { bg: '#e2e3e5', color: '#383d41' },
  APPROVED: { bg: '#d4edda', color: '#155724' },
  REJECTED: { bg: '#f8d7da', color: '#721c24' }
};

function StatusBadge({ status, colorMap }) {
  const style = colorMap[status] || { bg: '#e2e3e5', color: '#383d41' };
  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: style.bg,
      color: style.color
    }}>
      {status}
    </span>
  );
}

function RequestTable({ requests, onRowClick }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      let date;
      if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp?._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Customer</th>
            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</th>
            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Completion</th>
            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Created</th>
            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Reminder</th>
            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Review</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                No requests found.
              </td>
            </tr>
          ) : requests.map((request, index) => (
            <tr
              key={request.id}
              onClick={() => onRowClick(request)}
              style={{
                borderBottom: '1px solid #dee2e6',
                cursor: 'pointer',
                backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8f4fd'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa'}
            >
              <td style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: '600' }}>{request.customerName}</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>{request.customerPhone}</div>
              </td>
              <td style={{ padding: '14px 16px' }}>
                <StatusBadge status={request.status} colorMap={STATUS_COLORS} />
              </td>
              <td style={{ padding: '14px 16px', color: '#495057' }}>{request.completionPercent}%</td>
              <td style={{ padding: '14px 16px', color: '#6c757d', whiteSpace: 'nowrap' }}>{formatDate(request.createdAt)}</td>
              <td style={{ padding: '14px 16px' }}>
                <ReminderBadge needsReminderLevel={request.needsReminderLevel || 0} />
              </td>
              <td style={{ padding: '14px 16px' }}>
                <StatusBadge status={request.reviewStatus || 'PENDING'} colorMap={REVIEW_COLORS} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RequestTable;
