import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { MODULES } from '../constants/modules';
import { normalizeTechnicalStatus } from '../constants/technicalRequest';
import { getRequestFetchMode } from '../lib/permissions';

export async function fetchAllWorkspaceRequests(user, activeRole) {
  const results = await Promise.all(
    MODULES.map(async (mod) => {
      const mode = getRequestFetchMode(user, mod.id, activeRole);
      if (mode === 'none') return [];

      const ref = collection(db, mod.collection);
      let snap;
      if (mode === 'own') {
        snap = await getDocs(query(ref, where('userId', '==', user.id)));
      } else if (mode === 'assigned') {
        snap = await getDocs(query(ref, where('assignedToUserId', '==', user.id)));
      } else {
        snap = await getDocs(query(ref));
      }

      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
          moduleId: mod.id,
          collection: mod.collection,
          moduleTitle: mod.shortTitle,
          category: data.category || mod.id,
          status: normalizeTechnicalStatus(data.status),
        });
      });

      return list;
    }),
  );

  const merged = results.flat();
  merged.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return merged;
}

export function useWorkspaceRequests(user, activeRole) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchAllWorkspaceRequests(user, activeRole)
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load requests');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, activeRole]);

  return { requests, loading, error, setRequests, refresh: () => fetchAllWorkspaceRequests(user, activeRole).then(setRequests) };
}
