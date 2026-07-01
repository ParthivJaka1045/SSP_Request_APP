import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { filterActiveItems, sortItemsByName, filterCatalogItems } from '../lib/items';

export function useModuleItems(category, { activeOnly = false, refreshKey = 0, catalogOnly = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'items'), where('category', '==', category));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        let sorted = sortItemsByName(activeOnly ? filterActiveItems(list) : list);
        if (catalogOnly) sorted = filterCatalogItems(sorted);
        if (!cancelled) setItems(sorted);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load items');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, activeOnly, refreshKey, catalogOnly]);

  return { items, loading, error, setItems };
}

export function useFilteredItems(items, searchTerm) {
  return useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        String(i.name || '').toLowerCase().includes(term) ||
        String(i.description || '').toLowerCase().includes(term),
    );
  }, [items, searchTerm]);
}
