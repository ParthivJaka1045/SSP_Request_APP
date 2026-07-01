import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getModuleById } from '../constants/modules';
import { normalizeTechnicalStatus } from '../constants/technicalRequest';
import { getRequestFetchMode } from './permissions';

export async function fetchModuleRequests(moduleId, user, activeRole) {
  const mod = getModuleById(moduleId);
  const ref = collection(db, mod.collection);
  const mode = getRequestFetchMode(user, moduleId, activeRole);

  if (mode === 'none') {
    return [];
  }

  let snap;
  if (mode === 'own') {
    snap = await getDocs(query(ref, where('userId', '==', user.id)));
  } else if (mode === 'assigned') {
    snap = await getDocs(query(ref, where('assignedToUserId', '==', user.id)));
  } else {
    snap = await getDocs(query(ref));
  }

  let reqs = [];
  snap.forEach((d) => {
    const data = d.data();
    reqs.push({
      id: d.id,
      ...data,
      moduleId,
      category: data.category || moduleId,
      status: normalizeTechnicalStatus(data.status),
    });
  });

  reqs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return reqs;
}

export { filterRequestsForReport } from './permissions';
