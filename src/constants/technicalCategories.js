/** Technical item sub-categories — used in catalog filter and user add-item form. */

export const TECHNICAL_CATEGORIES = [
  { id: 'hardware', label: 'Hardware' },
  { id: 'peripherals', label: 'Peripherals' },
  { id: 'network', label: 'Network' },
  { id: 'software', label: 'Software' },
  { id: 'other', label: 'Other' },
];

export function getTechnicalCategoryLabel(id) {
  return TECHNICAL_CATEGORIES.find((c) => c.id === id)?.label || id || 'Other';
}
