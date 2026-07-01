import { TECHNICAL_REQUEST_STATUS } from '../constants/technicalRequest';

export const REQUEST_STAGES = [
  { key: 'submitted', label: 'Submitted', status: TECHNICAL_REQUEST_STATUS.Submitted },
  { key: 'approved', label: 'Approved', status: TECHNICAL_REQUEST_STATUS.Approved },
  { key: 'inprogress', label: 'In progress', status: TECHNICAL_REQUEST_STATUS.InProgress },
  { key: 'completed', label: 'Completed', status: TECHNICAL_REQUEST_STATUS.Completed },
];

export function getRequestProgress(request) {
  const status = request?.status || TECHNICAL_REQUEST_STATUS.Submitted;

  if (status === TECHNICAL_REQUEST_STATUS.Rejected) {
    return {
      percent: 100,
      currentLabel: 'Rejected',
      isRejected: true,
      activeIndex: -1,
      barClass: 'request-progress__bar--rejected',
    };
  }

  const index = REQUEST_STAGES.findIndex((s) => s.status === status);
  const activeIndex = index >= 0 ? index : 0;
  const percent = ((activeIndex + 1) / REQUEST_STAGES.length) * 100;

  return {
    percent,
    currentLabel: request?.subStatus ? `${status} (${request.subStatus})` : status,
    isRejected: false,
    activeIndex,
    barClass: status === TECHNICAL_REQUEST_STATUS.Completed ? 'request-progress__bar--done' : 'request-progress__bar--active',
  };
}

export function formatRequestTimestamp(value) {
  if (!value) return '—';
  if (value?.toDate) return value.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return String(value);
}
