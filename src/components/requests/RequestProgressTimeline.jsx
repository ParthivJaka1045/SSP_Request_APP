import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import { REQUEST_STAGES, getRequestProgress, formatRequestTimestamp } from '../../lib/requestProgress';
import { TECHNICAL_REQUEST_STATUS } from '../../constants/technicalRequest';

export default function RequestProgressTimeline({ request, compact }) {
  if (!request) return null;

  const progress = getRequestProgress(request);
  const isRejected = request.status === TECHNICAL_REQUEST_STATUS.Rejected;

  return (
    <div className={`request-progress ${compact ? 'request-progress--compact' : ''}`}>
      <div className="request-progress__head">
        <div>
          <p className="section-kicker">Timeline</p>
          <p className="request-progress__current">{progress.currentLabel}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="request-progress__track-wrap">
        <div className="request-progress__track">
          <div
            className={`request-progress__bar ${progress.barClass}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="request-progress__labels">
          {isRejected ? (
            <>
              <span>Submitted</span>
              <span className="request-progress__label--rejected">Rejected</span>
              <span>—</span>
            </>
          ) : (
            REQUEST_STAGES.map((stage, i) => (
              <span
                key={stage.key}
                className={i <= progress.activeIndex ? 'is-done' : ''}
              >
                {stage.label}
              </span>
            ))
          )}
        </div>
      </div>

      {!compact && (
        <div className="request-progress__meta">
          <div>
            <span>Submitted</span>
            <strong>{formatRequestTimestamp(request.createdAt)}</strong>
          </div>
          <div>
            <span>Last update</span>
            <strong>{formatRequestTimestamp(request.decidedAt || request.updatedAt || request.createdAt)}</strong>
          </div>
          {request.assignedToUserName && (
            <div>
              <span>Assigned</span>
              <strong>{request.assignedToUserName}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
