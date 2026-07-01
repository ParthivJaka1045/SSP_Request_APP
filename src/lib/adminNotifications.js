import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SSP_ROLES } from './permissions';

const COLLECTION = 'admin_notifications';

/** Who should receive this notification. */
export const RECIPIENT = Object.freeze({
  ADMINS: 'admins',
  COORDINATORS: 'coordinators',
  USER: 'user',
});

export async function createNotification(payload) {
  try {
    await addDoc(collection(db, COLLECTION), {
      type: payload.type || 'message',
      title: payload.title || 'Update',
      message: payload.message || '',
      requestId: payload.requestId || null,
      moduleId: payload.moduleId || null,
      noteId: payload.noteId || null,
      senderName: payload.senderName || 'System',
      senderRole: payload.senderRole || 'system',
      recipientType: payload.recipientType || (payload.targetUserId ? RECIPIENT.USER : RECIPIENT.ADMINS),
      recipientUserId: payload.targetUserId || payload.recipientUserId || null,
      linkPath: payload.linkPath || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }
}

export async function createNotifications(entries) {
  await Promise.all(entries.map((entry) => createNotification(entry)));
}

/** Whether a notification should appear for the current user + active role. */
export function notificationVisibleToUser(data, userId, activeRole) {
  if (!data || !userId) return false;

  const role = activeRole || SSP_ROLES.member;

  // Admin sees every notification in the system.
  if (role === SSP_ROLES.admin) return true;

  let legacyTargetUserId = null;
  if (data.linkPath && data.linkPath.includes('targetUser=')) {
    const parts = data.linkPath.split('?');
    if (parts.length > 1) {
      legacyTargetUserId = new URLSearchParams(parts[1]).get('targetUser');
    }
  }

  const recipientType = data.recipientType || (legacyTargetUserId || data.recipientUserId ? RECIPIENT.USER : RECIPIENT.ADMINS);
  const recipientUserId = data.recipientUserId || legacyTargetUserId || null;

  if (recipientType === RECIPIENT.ADMINS) {
    return role === SSP_ROLES.admin;
  }

  if (recipientType === RECIPIENT.COORDINATORS) {
    return role === SSP_ROLES.coordinator;
  }

  if (recipientType === RECIPIENT.USER) {
    if (recipientUserId !== userId) return false;
    return (
      role === SSP_ROLES.member
      || role === SSP_ROLES.hod
      || role === SSP_ROLES.santo
      || role === SSP_ROLES.coordinator
    );
  }

  return false;
}

export function subscribeToNotifications(userId, activeRole, callback, max = 50) {
  if (!userId) return () => {};

  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(150));

  return onSnapshot(
    q,
    (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        if (data.linkPath && data.linkPath.includes('targetUser=')) {
          data.linkPath = data.linkPath.replace(/([?&])targetUser=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
        }
        if (notificationVisibleToUser(data, userId, activeRole)) {
          list.push(data);
        }
      });

      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      callback(list.slice(0, max));
    },
    (err) => {
      console.error('Notification snapshot error', err);
    },
  );
}

export async function fetchAdminNotifications(max = 30) {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(max * 3));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list.slice(0, max);
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, COLLECTION, id), { read: true });
}

export async function markAllNotificationsRead(ids) {
  await Promise.all(ids.map((id) => markNotificationRead(id)));
}

export function getUnreadCount(notifications) {
  return notifications.filter((n) => !n.read).length;
}

export const createAdminNotification = createNotification;
