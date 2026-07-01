import { TECHNICAL_REQUEST_STATUS, normalizeTechnicalStatus } from '../constants/technicalRequest';
import { monthKeyFromValue, toDate } from './utils/reportUtils';

export function getRequestDate(record) {
  if (record.neededByDate) return record.neededByDate;
  const created = toDate(record.createdAt);
  if (!created) return '';
  const y = created.getFullYear();
  const m = String(created.getMonth() + 1).padStart(2, '0');
  const d = String(created.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function withinDateRange(isoDate, startDate, endDate) {
  if (!isoDate) return true;
  if (startDate && isoDate < startDate) return false;
  if (endDate && isoDate > endDate) return false;
  return true;
}

export function matchesMonth(isoOrTimestamp, monthKey) {
  if (!monthKey) return true;
  return monthKeyFromValue(isoOrTimestamp) === monthKey;
}

export function matchesList(value, selectedList) {
  if (!selectedList?.length) return true;
  return selectedList.includes(value);
}

export function matchesMonths(isoOrTimestamp, monthKeys) {
  if (!monthKeys?.length) return true;
  const key = monthKeyFromValue(isoOrTimestamp);
  return monthKeys.includes(key);
}

export function matchesCategory(record, categoryFilter) {
  if (!categoryFilter || categoryFilter === 'All') return true;
  return (record.category || 'technical').toLowerCase() === categoryFilter.toLowerCase();
}

export function matchesCategories(record, categoryIds) {
  if (!categoryIds?.length) return true;
  const cat = record.category || record.moduleId || 'technical';
  return categoryIds.includes(cat);
}

export function matchesStatus(record, statusFilter) {
  if (!statusFilter || statusFilter === 'All') return true;
  return normalizeTechnicalStatus(record.status) === statusFilter;
}

export function matchesUserEmail(record, emailFilter) {
  if (!emailFilter) return true;
  return record.userEmail === emailFilter;
}

export function filterRequests(requests, filters) {
  const { startDate, endDate, monthKey, categoryFilter, statusFilter, userEmail } = filters;

  return requests.filter((r) => {
    const dateForRange = getRequestDate(r);
    return (
      withinDateRange(dateForRange, startDate, endDate) &&
      matchesMonth(r.createdAt || dateForRange, monthKey) &&
      matchesCategory(r, categoryFilter) &&
      matchesStatus(r, statusFilter) &&
      matchesUserEmail(r, userEmail)
    );
  });
}

export function buildRequestMetrics(requests) {
  const total = requests.length;
  let pending = 0;
  let approved = 0;
  let inProgress = 0;
  let completed = 0;
  let rejected = 0;

  for (const r of requests) {
    const st = normalizeTechnicalStatus(r.status);
    if (st === TECHNICAL_REQUEST_STATUS.Completed) completed++;
    else if (st === TECHNICAL_REQUEST_STATUS.Rejected) rejected++;
    else if (st === TECHNICAL_REQUEST_STATUS.Approved) approved++;
    else if (st === TECHNICAL_REQUEST_STATUS.InProgress) inProgress++;
    else pending++;
  }

  return { total, pending, approved, inProgress, completed, rejected };
}

export function buildPersonWiseRows(requests) {
  const map = {};
  for (const r of requests) {
    const email = r.userEmail || 'unknown';
    if (!map[email]) {
      map[email] = {
        userName: r.userName || email.split('@')[0],
        email,
        total: 0,
        completed: 0,
        rejected: 0,
        pending: 0,
      };
    }
    map[email].total++;
    const st = normalizeTechnicalStatus(r.status);
    if (st === TECHNICAL_REQUEST_STATUS.Completed) map[email].completed++;
    else if (st === TECHNICAL_REQUEST_STATUS.Rejected) map[email].rejected++;
    else map[email].pending++;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

export function buildItemUsageRows(requests) {
  const counts = new Map();

  for (const r of requests) {
    const st = normalizeTechnicalStatus(r.status);
    if (st === TECHNICAL_REQUEST_STATUS.Rejected) continue;

    const itemName = r.finalItemName || r.itemType || r.customItem || 'Unknown';
    const category = r.category || 'technical';
    const key = `${category}::${itemName}`;
    const current = counts.get(key) || { itemName, category, total: 0 };
    current.total += 1;
    counts.set(key, current);
  }

  return Array.from(counts.values()).sort((a, b) => b.total - a.total);
}

export function buildStatusSummary(requests) {
  const metrics = buildRequestMetrics(requests);
  return [
    { status: 'Submitted / Pending', count: metrics.pending },
    { status: 'Approved', count: metrics.approved },
    { status: 'In progress', count: metrics.inProgress },
    { status: 'Completed', count: metrics.completed },
    { status: 'Rejected', count: metrics.rejected },
  ];
}

export function uniqueMonthOptions(requests) {
  const keys = new Set();
  for (const r of requests) {
    const k = monthKeyFromValue(r.createdAt);
    if (k) keys.add(k);
  }
  return Array.from(keys).sort().reverse();
}

export function buildMemberwiseRows(requests) {
  const map = new Map();

  for (const r of requests) {
    const st = normalizeTechnicalStatus(r.status);
    if (st === TECHNICAL_REQUEST_STATUS.Rejected) continue;

    const email = r.userEmail || 'unknown';
    const itemName = r.finalItemName || r.itemType || 'Unknown';
    const category = r.category || r.moduleId || 'technical';
    const key = `${email}::${category}::${itemName}`;

    if (!map.has(key)) {
      map.set(key, {
        userName: r.userName || email.split('@')[0],
        email,
        username: email.split('@')[0],
        category,
        itemName,
        total: 0,
      });
    }

    map.get(key).total += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function resolveUserDisplayName(record, usersByEmail = {}) {
  if (record?.userName?.trim()) return record.userName.trim();
  const email = record?.userEmail || record?.email || '';
  if (email && usersByEmail[email]?.name) return usersByEmail[email].name;
  if (email) return email.split('@')[0];
  return 'Unknown';
}

export function usersWithoutSantoAssignment(users, requests) {
  const santoUsers = users.filter((u) => {
    const roles = u.roles || (u.role ? [u.role] : []);
    return roles.includes('santo') && u.isActive !== false;
  });
  return santoUsers.filter((s) => !s.santoTag?.trim()).length;
}
