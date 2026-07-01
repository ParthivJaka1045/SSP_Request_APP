/** Item name normalization & duplicate checks (STK-style). */

export function normalizeItemName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function findItemByName(items, name) {
  const key = normalizeItemName(name);
  return items.find((i) => normalizeItemName(i.name) === key) || null;
}

/** Catalog items for new requirement — excludes replacement-only custom entries. */
export function filterCatalogItems(items) {
  return (items || []).filter((i) => i.replacementOnly !== true);
}

export function filterActiveItems(items) {
  return items.filter((i) => i.isActive !== false);
}

export function sortItemsByName(items) {
  return [...items].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'gu', { sensitivity: 'base' }),
  );
}

/** Keep first item per normalized name; return ids to delete. */
export function findDuplicateItemIds(items) {
  const seen = new Map();
  const toDelete = [];
  for (const item of sortItemsByName(items)) {
    const key = normalizeItemName(item.name);
    if (!key) continue;
    if (seen.has(key)) {
      toDelete.push(item.id);
    } else {
      seen.set(key, item.id);
    }
  }
  return toDelete;
}
