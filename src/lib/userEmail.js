import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/** Normalize email for storage and lookup (lowercase, trimmed). */
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

/** Check local list (case-insensitive). */
export function emailExistsInList(users, email, excludeId = null) {
  const key = normalizeEmail(email);
  if (!key) return false;
  return (users || []).some(
    (u) => normalizeEmail(u.email) === key && u.id !== excludeId,
  );
}

/** Check Firestore — email field must be stored lowercase. */
export async function emailExistsInFirestore(email, excludeId = null) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const q = query(collection(db, 'users'), where('email', '==', normalized));
  const snap = await getDocs(q);
  return snap.docs.some((d) => d.id !== excludeId);
}

export async function assertEmailAvailable(email, { users = [], excludeId = null } = {}) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error('Email is required.');
  }
  if (!isValidEmail(normalized)) {
    throw new Error('Please enter a valid email address.');
  }
  if (emailExistsInList(users, normalized, excludeId)) {
    throw new Error('An account with this email already exists. Please use a different email.');
  }
  const inDb = await emailExistsInFirestore(normalized, excludeId);
  if (inDb) {
    throw new Error('An account with this email already exists. Please use a different email.');
  }
  return normalized;
}
