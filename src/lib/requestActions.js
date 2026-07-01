import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getModuleById } from '../constants/modules';
import { TECHNICAL_REQUEST_STATUS, normalizeTechnicalStatus } from '../constants/technicalRequest';
import { createNotification, createNotifications, RECIPIENT } from './adminNotifications';
import { SSP_ROLES } from './permissions';

export async function notifyNewRequest(requestData, moduleConfig) {
  const modName = moduleConfig?.title || 'a module';
  const userLabel = requestData.userName || requestData.userEmail || 'A user';
  const moduleId = requestData.categoryId || requestData.category || requestData.moduleId;
  const linkPath = `/orders?open=${requestData.id}&module=${moduleId}`;

  await createNotifications([
    {
      type: 'status',
      recipientType: RECIPIENT.ADMINS,
      title: `New Request: ${modName}`,
      message: `${userLabel} submitted a new request.`,
      requestId: requestData.id,
      moduleId,
      senderName: userLabel,
      senderRole: SSP_ROLES.member,
      linkPath,
    },
    {
      type: 'status',
      recipientType: RECIPIENT.COORDINATORS,
      title: `New Request: ${modName}`,
      message: `${userLabel} submitted a new request — please review and mark Seen.`,
      requestId: requestData.id,
      moduleId,
      senderName: userLabel,
      senderRole: SSP_ROLES.member,
      linkPath,
    },
  ]);
}

function buildOrderLink(request, noteId, { assignedView = false } = {}) {
  const module = request.moduleId || request.category || 'technical';
  const path = assignedView ? '/assigned' : '/orders';
  const base = `${path}?open=${request.id}&module=${module}`;
  return noteId ? `${base}&note=${noteId}` : base;
}

function getAssigneeIds(request) {
  const ids = new Set();
  if (request?.assignedToUserId) ids.add(request.assignedToUserId);
  (request?.assignedToUsers || []).forEach((u) => {
    if (u?.id) ids.add(u.id);
  });
  return Array.from(ids);
}

export async function addRequestNote(request, notePayload, options = {}) {
  const mod = getModuleById(request.moduleId || request.category || 'technical');
  const notesRef = collection(db, `${mod.collection}/${request.id}/notes`);
  const noteDoc = await addDoc(notesRef, { ...notePayload, timestamp: serverTimestamp() });
  const noteId = noteDoc.id;

  const isMemberMessage = notePayload.senderRole === SSP_ROLES.member;

  if (!options.skipNotification) {
    if (isMemberMessage) {
      await createNotifications([
        {
          type: 'message',
          recipientType: RECIPIENT.ADMINS,
          title: notePayload.statusTitle || 'New message from member',
          message: notePayload.message,
          requestId: request.id,
          moduleId: request.moduleId || request.category,
          noteId,
          senderName: notePayload.senderName,
          senderRole: notePayload.senderRole,
          linkPath: buildOrderLink(request, noteId),
        },
        {
          type: 'message',
          recipientType: RECIPIENT.COORDINATORS,
          title: notePayload.statusTitle || 'New message from member',
          message: notePayload.message,
          requestId: request.id,
          moduleId: request.moduleId || request.category,
          noteId,
          senderName: notePayload.senderName,
          senderRole: notePayload.senderRole,
          linkPath: buildOrderLink(request, noteId),
        },
      ]);
    } else if (request.userId && notePayload.senderId !== request.userId) {
      await createNotification({
        type: 'message',
        title: notePayload.statusTitle || 'New message on your order',
        message: notePayload.message,
        requestId: request.id,
        moduleId: request.moduleId || request.category,
        noteId,
        senderName: notePayload.senderName,
        senderRole: notePayload.senderRole,
        recipientType: RECIPIENT.USER,
        targetUserId: request.userId,
        linkPath: buildOrderLink(request, noteId),
      });
    }
  }

  return noteId;
}

async function notifyAssignees(request, { title, message, actor, noteId, moduleId }) {
  const assigneeIds = getAssigneeIds(request).filter((id) => id && id !== actor?.id);
  if (!assigneeIds.length) return;

  await createNotifications(
    assigneeIds.map((userId) => ({
      type: 'assignment',
      recipientType: RECIPIENT.USER,
      targetUserId: userId,
      title,
      message,
      requestId: request.id,
      moduleId,
      noteId,
      senderName: actor?.name || 'System',
      senderRole: actor?.role || 'system',
      linkPath: buildOrderLink(request, noteId),
    })),
  );
}

export async function updateRequestStatus(request, { status, subStatus, note, actor, assignToUsers }) {
  const mod = getModuleById(request.moduleId || request.category || 'technical');
  const ref = doc(db, mod.collection, request.id);
  const normalizedStatus = normalizeTechnicalStatus(status);
  const moduleId = request.moduleId || request.category;

  const payload = {
    status: normalizedStatus,
    updatedAt: serverTimestamp(),
  };

  if (normalizedStatus === TECHNICAL_REQUEST_STATUS.InProgress) {
    payload.subStatus = subStatus || null;
  } else if (normalizedStatus === TECHNICAL_REQUEST_STATUS.Rejected) {
    payload.subStatus = subStatus || null;
  } else {
    payload.subStatus = null;
  }

  if (note?.trim()) {
    payload.lastDecisionNote = note.trim();
  }

  if (actor) {
    payload.decisionById = actor.id;
    payload.decisionByName = actor.name;
    payload.decisionByEmail = actor.email;
    payload.decidedAt = serverTimestamp();
  }

  const previousAssigneeIds = getAssigneeIds(request);

  if (assignToUsers !== undefined) {
    if (Array.isArray(assignToUsers) && assignToUsers.length > 0) {
      payload.assignedToUsers = assignToUsers.map((u) => ({
        id: u.id,
        name: u.name || null,
        email: u.email || null,
        santoTag: u.santoTag || null,
      }));
      payload.assignedToUserId = assignToUsers[0].id;
      payload.assignedToUserName = assignToUsers[0].name || null;
      payload.assignedToUserEmail = assignToUsers[0].email || null;
    } else {
      payload.assignedToUsers = [];
      payload.assignedToUserId = null;
      payload.assignedToUserName = null;
      payload.assignedToUserEmail = null;
    }
  }

  await updateDoc(ref, payload);

  const updatedRequest = { ...request, ...payload, status: normalizedStatus, subStatus: payload.subStatus };

  let title = normalizedStatus;
  if (
    (normalizedStatus === TECHNICAL_REQUEST_STATUS.InProgress || normalizedStatus === TECHNICAL_REQUEST_STATUS.Rejected)
    && subStatus
  ) {
    title = `${normalizedStatus} (${subStatus})`;
  }

  let noteId = null;
  if (note?.trim()) {
    noteId = await addRequestNote(request, {
      senderId: actor?.id || 'system',
      senderName: actor?.name || 'System',
      senderRole: actor?.role || 'system',
      statusTitle: title,
      message: note.trim(),
    }, { skipNotification: true });
  } else {
    let msg = `Request status updated to ${title}`;
    if (normalizedStatus === TECHNICAL_REQUEST_STATUS.Approved) msg = 'Your request has been approved.';
    else if (normalizedStatus === TECHNICAL_REQUEST_STATUS.Seen) msg = 'Your request has been seen and is under review.';
    else if (normalizedStatus === TECHNICAL_REQUEST_STATUS.Rejected) msg = 'Your request was rejected.';
    else if (normalizedStatus === TECHNICAL_REQUEST_STATUS.Completed) msg = 'Request has been marked as completed.';

    noteId = await addRequestNote(request, {
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      message: msg,
      isSystem: true,
    }, { skipNotification: true });
  }

  const statusMessage = note?.trim() || `Request updated to ${title}`;
  const linkPath = buildOrderLink(request, noteId);

  // 1) Notify request owner (member)
  if (request.userId && actor?.id !== request.userId) {
    await createNotification({
      type: 'status',
      recipientType: RECIPIENT.USER,
      targetUserId: request.userId,
      title: `Status Updated: ${title}`,
      message: statusMessage,
      requestId: request.id,
      moduleId,
      noteId,
      senderName: actor?.name || 'System',
      senderRole: actor?.role || 'system',
      linkPath,
    });
  }

  // 2) Notify admin for every status change
  await createNotification({
    type: 'status',
    recipientType: RECIPIENT.ADMINS,
    title: `Status Updated: ${title}`,
    message: `${request.finalItemName || request.itemType || 'Request'} — ${statusMessage}`,
    requestId: request.id,
    moduleId,
    noteId,
    senderName: actor?.name || 'System',
    senderRole: actor?.role || 'system',
    linkPath,
  });

  // 3) When marked Seen by admin/HOD/Santo, notify coordinators
  if (normalizedStatus === TECHNICAL_REQUEST_STATUS.Seen && actor?.role !== SSP_ROLES.coordinator) {
    await createNotification({
      type: 'status',
      recipientType: RECIPIENT.COORDINATORS,
      title: `Marked Seen: ${request.finalItemName || request.itemType || 'Request'}`,
      message: statusMessage,
      requestId: request.id,
      moduleId,
      noteId,
      senderName: actor?.name || 'System',
      senderRole: actor?.role || 'system',
      linkPath,
    });
  }

  // 4) Notify assigned HOD / Santo users
  await notifyAssignees(updatedRequest, {
    title: `Order update: ${title}`,
    message: statusMessage,
    actor,
    noteId,
    moduleId,
  });

  // 5) New assignments → direct notification to newly assigned staff
  if (assignToUsers !== undefined && Array.isArray(assignToUsers)) {
    const newIds = assignToUsers.map((u) => u.id).filter(Boolean);
    const newlyAssigned = newIds.filter((id) => !previousAssigneeIds.includes(id));
    if (newlyAssigned.length) {
      await createNotifications(
        newlyAssigned.map((userId) => ({
          type: 'assignment',
          recipientType: RECIPIENT.USER,
          targetUserId: userId,
          title: 'Order assigned to you',
          message: `You have been assigned: ${request.finalItemName || request.itemType || 'Request'}. View in Assign To Me.`,
          requestId: request.id,
          moduleId,
          senderName: actor?.name || 'System',
          senderRole: actor?.role || 'system',
          linkPath: buildOrderLink(request, noteId, { assignedView: true }),
        })),
      );
    }
  }

  return updatedRequest;
}
