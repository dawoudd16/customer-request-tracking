/**
 * Reminder Badge Component
 * 
 * Displays a visual indicator for reminder levels:
 * - None: No badge
 * - Level 1 (24h): Yellow badge
 * - Level 2 (48h): Red badge
 */

import React from 'react';

/**
 * @param {number} needsReminderLevel - 0 (none), 1 (24h), or 2 (48h)
 */
function ReminderBadge({ needsReminderLevel }) {
  if (needsReminderLevel === 0) {
    return null; // No badge needed
  }

  if (needsReminderLevel === 1) {
    return (
      <span style={{
        backgroundColor: '#ffc107',
        color: '#000',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        Needs Reminder (24h)
      </span>
    );
  }

  if (needsReminderLevel === 2) {
    return (
      <span style={{
        backgroundColor: '#dc3545',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        Needs Reminder (48h)
      </span>
    );
  }

  return null;
}

export default ReminderBadge;

