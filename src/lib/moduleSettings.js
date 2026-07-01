import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const SETTINGS_DOC = 'settings/modules';

const DEFAULTS = {
  allowUserItemAdd: {
    technical: false,
    general: false,
    subscription: false,
    travel: false,
  },
};

export async function fetchModuleSettings() {
  try {
    const snap = await getDoc(doc(db, ...SETTINGS_DOC.split('/')));
    if (!snap.exists()) return { ...DEFAULTS };
    return { ...DEFAULTS, ...snap.data() };
  } catch {
    return { ...DEFAULTS };
  }
}

export function subscribeModuleSettings(callback) {
  const ref = doc(db, ...SETTINGS_DOC.split('/'));
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? { ...DEFAULTS, ...snap.data() } : { ...DEFAULTS });
    },
    () => callback({ ...DEFAULTS }),
  );
}

export async function updateModuleSetting(key, value) {
  const ref = doc(db, ...SETTINGS_DOC.split('/'));
  const current = await fetchModuleSettings();
  await setDoc(ref, { ...current, [key]: value }, { merge: true });
}

export function canUserAddItems(settings, moduleId) {
  return Boolean(settings?.allowUserItemAdd?.[moduleId]);
}
