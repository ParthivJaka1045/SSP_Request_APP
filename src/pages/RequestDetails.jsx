import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getModuleById, MODULE_IDS } from '../constants/modules';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import RequestDetailPanel from '../components/requests/RequestDetailPanel';
import { canViewRequest } from '../lib/permissions';
import { normalizeTechnicalStatus } from '../constants/technicalRequest';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module') || MODULE_IDS.technical;
  const mod = getModuleById(moduleId);
  const { currentUser, activeRole } = useAuth();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, mod.collection, id));
        if (!snap.exists()) {
          setAllowed(false);
          return;
        }
        const data = { id: snap.id, ...snap.data(), status: normalizeTechnicalStatus(snap.data().status), moduleId };
        if (!canViewRequest(currentUser, data, activeRole)) {
          navigate('/orders', { replace: true });
          return;
        }
        setAllowed(true);
      } catch {
        setAllowed(false);
      }
    })();
  }, [id, moduleId, currentUser, activeRole]);

  if (allowed === null) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>;
  }

  if (!allowed) {
    return (
      <PageShell title="Not found" backTo="/orders">
        <p>Request not found or access denied.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Request Details" backTo="/orders">
      <RequestDetailPanel requestId={id} moduleId={moduleId} />
    </PageShell>
  );
}
