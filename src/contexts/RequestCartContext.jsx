import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const RequestCartContext = createContext(null);

const STORAGE_KEY = 'ssp_request_cart';

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStored(items) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Global Request Cart — each line is a full request draft (not a quick add). */
export function RequestCartProvider({ children }) {
  const [items, setItems] = useState(loadStored);

  const addDraft = useCallback((entry) => {
    const key = entry.key || `${entry.moduleId}:${entry.itemId}:${Date.now()}`;
    setItems((prev) => {
      const next = [...prev, { ...entry, key }];
      saveStored(next);
      return next;
    });
    return key;
  }, []);

  const updateDraft = useCallback((key, patch) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.key === key ? { ...i, ...patch } : i));
      saveStored(next);
      return next;
    });
  }, []);

  const removeDraft = useCallback((key) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.key !== key);
      saveStored(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveStored([]);
  }, []);

  const countByModule = useMemo(() => {
    const map = {};
    for (const i of items) {
      map[i.moduleId] = (map[i.moduleId] || 0) + 1;
    }
    return map;
  }, [items]);

  const totalCount = items.length;

  const value = {
    cartItems: items,
    addDraft,
    updateDraft,
    removeDraft,
    clearCart,
    countByModule,
    totalCount,
  };

  return <RequestCartContext.Provider value={value}>{children}</RequestCartContext.Provider>;
}

export function useRequestCart() {
  const ctx = useContext(RequestCartContext);
  if (!ctx) throw new Error('useRequestCart must be used within RequestCartProvider');
  return ctx;
}
