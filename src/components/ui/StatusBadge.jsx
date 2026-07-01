import React from 'react';
import { TECHNICAL_REQUEST_STATUS } from '../../constants/technicalRequest';

const STATUS_CLASS_MAP = {
  [TECHNICAL_REQUEST_STATUS.Submitted]: 'status-badge--submitted',
  [TECHNICAL_REQUEST_STATUS.Seen]: 'status-badge--seen',
  [TECHNICAL_REQUEST_STATUS.Approved]: 'status-badge--approved',
  [TECHNICAL_REQUEST_STATUS.InProgress]: 'status-badge--in-progress',
  [TECHNICAL_REQUEST_STATUS.Completed]: 'status-badge--completed',
  [TECHNICAL_REQUEST_STATUS.Rejected]: 'status-badge--rejected',
};

export default function StatusBadge({ status }) {
  const modifier = STATUS_CLASS_MAP[status] || 'status-badge--default';
  return (
    <span className={`status-badge ${modifier}`}>
      {status || 'Unknown'}
    </span>
  );
}
