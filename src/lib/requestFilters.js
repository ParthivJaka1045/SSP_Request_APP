import { TECHNICAL_REQUEST_STATUS } from '../constants/technicalRequest';

export function isToday(timestamp) {
  if (!timestamp?.toDate) return false;
  const d = timestamp.toDate();
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isPendingRequest(request) {
  const st = request.status;
  return (
    st !== TECHNICAL_REQUEST_STATUS.Completed &&
    st !== TECHNICAL_REQUEST_STATUS.Rejected
  );
}

export function filterRequestsByView(requests, view) {
  if (view === 'pending') {
    return requests.filter(isPendingRequest);
  }
  if (view === 'today') {
    return requests.filter((r) => isToday(r.createdAt));
  }
  return requests;
}
