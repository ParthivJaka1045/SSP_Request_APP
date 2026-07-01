export const URGENCY_LEVELS = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High'
};

export function parseUrgency(urgency) {
  if (!urgency) return URGENCY_LEVELS.Low;
  const lower = urgency.toLowerCase();
  if (lower.includes('high') || lower.includes('red')) return URGENCY_LEVELS.High;
  if (lower.includes('medium') || lower.includes('blue') || lower.includes('yellow')) return URGENCY_LEVELS.Medium;
  return URGENCY_LEVELS.Low;
}

export function getUrgencyBadgeClass(urgency) {
  const parsed = parseUrgency(urgency);
  switch (parsed) {
    case URGENCY_LEVELS.High: return 'urgency-badge urgency-high';
    case URGENCY_LEVELS.Medium: return 'urgency-badge urgency-medium';
    case URGENCY_LEVELS.Low:
    default: return 'urgency-badge urgency-low';
  }
}

export function sortRequestsByUrgency(requests) {
  const urgencyWeight = {
    [URGENCY_LEVELS.High]: 3,
    [URGENCY_LEVELS.Medium]: 2,
    [URGENCY_LEVELS.Low]: 1
  };
  
  return [...requests].sort((a, b) => {
    const wA = urgencyWeight[parseUrgency(a.urgency)];
    const wB = urgencyWeight[parseUrgency(b.urgency)];
    if (wA !== wB) {
      return wB - wA; // Higher weight first
    }
    // Secondary sort by date descending
    const dateA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
    const dateB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
    return dateB - dateA;
  });
}
