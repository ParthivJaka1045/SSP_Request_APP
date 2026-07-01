import React, { useState, useEffect, useRef } from 'react';
import { getModuleById } from '../../constants/modules';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  doc, getDoc, collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, updateDoc, getDocs,
} from 'firebase/firestore';
import { Send, CheckCircle, Shield, Edit2, Save } from 'lucide-react';
import {
  TECHNICAL_REQUEST_STATUS,
  TECHNICAL_REQUEST_SUBSTATUS,
  IN_PROGRESS_SUBSTATUS_OPTIONS,
  normalizeTechnicalStatus,
} from '../../constants/technicalRequest';
import { TECH_LABELS } from '../../lib/labels/technical';
import FormLabel from '../ui/FormLabel';
import StatusBadge from '../ui/StatusBadge';
import {
  canAssignRequest,
  canManageRequestStatus,
  canAdvanceRequestStatus,
  canRejectRequest,
  canMarkRequestSeen,
  canEditRequestAsUser,
  resolveActiveRole,
} from '../../lib/permissions';
import { updateRequestStatus, addRequestNote } from '../../lib/requestActions';
import RequestProgressTimeline from './RequestProgressTimeline';
import AssignmentPicker from './AssignmentPicker';
import InProgressSubStatusPicker from './InProgressSubStatusPicker';
import { formatDate } from '../../lib/formatDate';

export default function RequestDetailPanel({ requestId, moduleId, onUpdated, compact, highlightNoteId }) {
  const { currentUser, activeRole } = useAuth();
  const mod = getModuleById(moduleId);
  const coll = mod.collection;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const highlightDoneRef = useRef(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [inProgressSub, setInProgressSub] = useState(TECHNICAL_REQUEST_SUBSTATUS.AlternateSuggestions);

  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignToUserIds, setAssignToUserIds] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editJustification, setEditJustification] = useState('');
  const [editComments, setEditComments] = useState('');

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    fetchRequestDetails();
  }, [requestId, moduleId]);

  useEffect(() => {
    if (canAssignRequest(currentUser, activeRole)) fetchAssignableUsers();
  }, [currentUser, activeRole]);

  useEffect(() => {
    highlightDoneRef.current = false;
  }, [highlightNoteId, requestId]);

  useEffect(() => {
    if (!request) return;
    const notesRef = collection(db, `${coll}/${requestId}/notes`);
    const q = query(notesRef, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setNotes(list);
      setTimeout(() => {
        if (highlightNoteId) return;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsub();
  }, [request, requestId, coll, highlightNoteId]);

  useEffect(() => {
    if (!highlightNoteId || !notes.length) return;
    if (highlightDoneRef.current) return;
    const el = chatMessagesRef.current?.querySelector(`[data-note-id="${highlightNoteId}"]`);
    if (!el) return;
    highlightDoneRef.current = true;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
  }, [highlightNoteId, notes]);

  const fetchRequestDetails = async () => {
    try {
      const snap = await getDoc(doc(db, coll, requestId));
      if (snap.exists()) {
        const raw = snap.data();
        const data = { id: snap.id, ...raw, status: normalizeTechnicalStatus(raw.status), moduleId };
        setRequest(data);
        if (data.assignedToUsers && Array.isArray(data.assignedToUsers)) {
          setAssignToUserIds(data.assignedToUsers.map(u => u.id));
        } else if (data.assignedToUserId) {
          setAssignToUserIds([data.assignedToUserId]);
        } else {
          setAssignToUserIds([]);
        }
        setEditJustification(data.justification || '');
        setEditComments(data.comments || '');
        if (data.subStatus && IN_PROGRESS_SUBSTATUS_OPTIONS.some((o) => o.value === data.subStatus)) {
          setInProgressSub(data.subStatus);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchAssignableUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = [];
      snap.forEach((d) => {
        const u = { id: d.id, ...d.data() };
        const roles = u.roles || (u.role ? [u.role] : ['member']);
        if ((roles.includes('santo') || roles.includes('hod')) && u.isActive !== false) list.push(u);
      });
      list.sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email)));
      setAssignableUsers(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendNote = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || request?.status === TECHNICAL_REQUEST_STATUS.Completed) return;
    try {
      await addRequestNote(request, {
        senderId: currentUser.id,
        senderName: currentUser.name || currentUser.email.split('@')[0],
        senderEmail: currentUser.email,
        senderRole: resolveActiveRole(currentUser, activeRole),
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch (e) {
      console.error(e);
    }
  };

  const submitStatusChange = async (nextStatus, extra = {}) => {
    setUpdatingStatus(true);
    try {
      const updated = await updateRequestStatus(request, {
        status: nextStatus,
        subStatus: extra.subStatus,
        note: statusNote.trim() || extra.note || '',
        actor: {
          id: currentUser.id,
          name: currentUser.name || currentUser.email,
          email: currentUser.email,
          role: resolveActiveRole(currentUser, activeRole),
        },
      });
      setRequest((prev) => ({ ...prev, ...updated }));
      setStatusNote('');
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
      alert('Could not update status.');
    }
    setUpdatingStatus(false);
  };

  const submitAssignmentUpdate = async () => {
    setUpdatingStatus(true);
    try {
      const assignToUsers = assignableUsers.filter((u) => assignToUserIds.includes(u.id));

      const hasHod = assignToUsers.some((u) => (u.roles || [u.role]).includes('hod'));
      const hasSanto = assignToUsers.some((u) => (u.roles || [u.role]).includes('santo'));
      if (hasHod && hasSanto) {
        alert('HOD અને Santo બંને સાથે assign ન થઈ શકે — એક group પસંદ કરો.');
        setUpdatingStatus(false);
        return;
      }

      const updated = await updateRequestStatus(request, {
        status: request.status,
        note: statusNote,
        actor: { 
          id: currentUser.id, 
          name: currentUser.name || currentUser.email, 
          email: currentUser.email, 
          role: resolveActiveRole(currentUser, activeRole) 
        },
        assignToUsers: assignToUsers.length > 0 ? assignToUsers : null,
      });

      setRequest((prev) => ({ ...prev, ...updated }));
      setStatusNote('');
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
      alert('Could not update status.');
    }
    setUpdatingStatus(false);
  };

  const saveUserEdits = async () => {
    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, coll, requestId), {
        justification: editJustification,
        comments: editComments,
      });
      setRequest((prev) => ({ ...prev, justification: editJustification, comments: editComments }));
      setIsEditing(false);
      await addRequestNote(request, {
        senderId: 'system',
        senderName: 'System',
        senderRole: 'system',
        message: `${currentUser.name || currentUser.email.split('@')[0]} updated the request details.`,
        isSystem: true,
      });
    } catch (e) {
      console.error(e);
    }
    setUpdatingStatus(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (!request) return <div style={{ padding: '2rem', textAlign: 'center' }}>Request not found.</div>;

  const isCompleted = request.status === TECHNICAL_REQUEST_STATUS.Completed;
  const canStaffEdit = canManageRequestStatus(currentUser, activeRole) && !isCompleted;
  const canAdvance = canAdvanceRequestStatus(currentUser, activeRole);
  const canReject = canRejectRequest(currentUser, activeRole);
  const canMarkSeen = canMarkRequestSeen(currentUser, activeRole);
  const canAdminEdit = canStaffEdit;
  const canUserEdit =
    canEditRequestAsUser(currentUser, request, activeRole) &&
    request.status === TECHNICAL_REQUEST_STATUS.InProgress &&
    request.subStatus === TECHNICAL_REQUEST_SUBSTATUS.MoreInfo;

  return (
    <div className={`request-detail-panel ${compact ? 'request-detail-panel--compact' : ''}`}>
      <div className="request-detail-panel__timeline">
        <RequestProgressTimeline request={request} compact={compact} />
      </div>
      <div className="request-detail-panel__main">
        <div className="glass-panel panel-padding">
          <div className="request-detail-panel__head">
            <div>
              <p className="order-card__module">{mod.shortTitle}</p>
              <h2>{request.finalItemName || request.itemType || request.customItem}</h2>
            </div>
            <StatusBadge status={request.status} />
          </div>

          {request.subStatus && request.status === TECHNICAL_REQUEST_STATUS.InProgress && (
            <p className="request-substatus-badge">
              In Progress: <strong>{request.subStatus}</strong>
            </p>
          )}

          <div className="order-card__meta" style={{ margin: '1rem 0' }}>
            {moduleId === 'travel' ? (
              <>
                <div><span>Departure</span><strong>{request.departureDate || '—'}{request.departureTime ? ` ${request.departureTime}` : ''}</strong></div>
                <div><span>Return</span><strong>{request.returnDate || '—'}</strong></div>
                <div><span>Reason</span><strong>{request.reason || '—'}</strong></div>
              </>
            ) : (
              <div><span>Needed by</span><strong>{request.neededByDate ? formatDate(request.neededByDate) : '—'}</strong></div>
            )}
            <div><span>User</span><strong>{request.userName || request.userEmail}</strong></div>
            <div><span>Urgency</span><strong>{request.urgency?.split('(')[0]?.trim() || '—'}</strong></div>
          </div>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <FormLabel label={TECH_LABELS.justification} />
                <textarea className="form-control" rows={3} value={editJustification} onChange={(e) => setEditJustification(e.target.value)} />
              </div>
              <div>
                <FormLabel label={TECH_LABELS.additionalComments} />
                <textarea className="form-control" rows={2} value={editComments} onChange={(e) => setEditComments(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={saveUserEdits} disabled={updatingStatus} className="btn btn-primary btn-sm">
                  <Save size={14} /> Save
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormLabel label={TECH_LABELS.justification} />
                  {canUserEdit && (
                    <button type="button" onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                </div>
                <div className="request-detail-box">{request.justification || '—'}</div>
              </div>
              {request.comments && (
                <div style={{ marginBottom: '1rem' }}>
                  <FormLabel label={TECH_LABELS.additionalComments} />
                  <div className="request-detail-box">{request.comments}</div>
                </div>
              )}
            </>
          )}
        </div>

        {canStaffEdit && (
          <div className="glass-panel panel-padding" style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Update status
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {canMarkSeen && request.status === TECHNICAL_REQUEST_STATUS.Submitted && (
                <button type="button" className="btn btn-secondary btn-sm" disabled={updatingStatus} onClick={() => submitStatusChange(TECHNICAL_REQUEST_STATUS.Seen)}>
                  Mark Seen
                </button>
              )}
              {canAdvance && request.status === TECHNICAL_REQUEST_STATUS.Seen && (
                <button type="button" className="btn btn-secondary btn-sm" disabled={updatingStatus} onClick={() => submitStatusChange(TECHNICAL_REQUEST_STATUS.Approved)}>
                  Approve
                </button>
              )}
              {canAdvance && request.status === TECHNICAL_REQUEST_STATUS.Approved && (
                <>
                  <InProgressSubStatusPicker
                    value={inProgressSub}
                    onChange={setInProgressSub}
                    disabled={updatingStatus}
                  />
                  {inProgressSub === TECHNICAL_REQUEST_SUBSTATUS.Other && (
                    <div className="form-group" style={{ width: '100%', marginTop: '0.5rem' }}>
                      <label className="form-label">
                        Note <span style={{ color: 'var(--accent-danger)' }}>(required for Other)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Explain the in-progress reason..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        disabled={updatingStatus}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={
                      updatingStatus
                      || !inProgressSub
                      || (inProgressSub === TECHNICAL_REQUEST_SUBSTATUS.Other && !statusNote.trim())
                    }
                    onClick={() => submitStatusChange(TECHNICAL_REQUEST_STATUS.InProgress, { subStatus: inProgressSub })}
                    style={{ marginTop: '0.5rem' }}
                  >
                    Set In Progress
                  </button>
                </>
              )}
              {canAdvance && request.status === TECHNICAL_REQUEST_STATUS.InProgress && (
                <button type="button" className="btn btn-primary btn-sm" disabled={updatingStatus} onClick={() => submitStatusChange(TECHNICAL_REQUEST_STATUS.Completed)}>
                  Complete
                </button>
              )}
              {canReject && request.status !== TECHNICAL_REQUEST_STATUS.Completed && request.status !== TECHNICAL_REQUEST_STATUS.Rejected && (
                <button type="button" className="btn btn-danger btn-sm" disabled={updatingStatus} onClick={() => submitStatusChange(TECHNICAL_REQUEST_STATUS.Rejected, { note: statusNote.trim() || 'Rejected' })}>
                  Reject
                </button>
              )}
            </div>
          </div>
        )}

        {canAdminEdit && (
          <div className="glass-panel panel-padding" style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Assignment & Notes
            </h3>

            {canAssignRequest(currentUser, activeRole) && (
              <div className="form-group">
                <label className="form-label">Assign / Forward to HOD or Santo</label>
                <AssignmentPicker
                  users={assignableUsers}
                  selectedIds={assignToUserIds}
                  onChange={setAssignToUserIds}
                  disabled={updatingStatus}
                />
              </div>
            )}

            {request.assignedToUsers?.length > 0 && (
              <div className="assign-current">
                <span className="assign-current__label">Currently assigned:</span>
                <div className="assign-current__chips">
                  {request.assignedToUsers.map((u) => (
                    <span key={u.id} className="assign-current__chip">
                      {u.santoTag ? `${u.santoTag} — ` : ''}{u.name || u.email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Internal Note / Update</label>
              <textarea className="form-control" rows={3} placeholder="Message goes to notes chat..." value={statusNote} onChange={(e) => setStatusNote(e.target.value)} disabled={updatingStatus} />
            </div>

            <button type="button" onClick={submitAssignmentUpdate} disabled={updatingStatus} className="btn btn-primary" style={{ width: '100%' }}>
              {updatingStatus ? 'Saving...' : 'Confirm Assignment & Update'}
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="glass-panel panel-padding" style={{ marginTop: '1rem', textAlign: 'center' }}>
            <CheckCircle size={28} color="var(--accent-secondary)" />
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>Completed — chat locked.</p>
          </div>
        )}
      </div>

      <div className="glass-panel chat-panel request-detail-panel__chat">
        <div className="chat-panel__head">
          <h3 style={{ margin: 0 }}>Notes & Communication</h3>
        </div>

        <div className="chat-panel__messages" ref={chatMessagesRef}>
          {notes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notes yet. Start chatting here.</p>
          ) : (
            notes.map((note) => {
              const isMine = note.senderId === currentUser.id;
              if (note.isSystem) {
                return (
                  <div key={note.id} className="chat-system-msg">{note.message}</div>
                );
              }
              return (
                <div
                  key={note.id}
                  data-note-id={note.id}
                  className={`chat-bubble-wrap ${isMine ? 'is-mine' : ''} ${note.id === highlightNoteId ? 'chat-bubble-wrap--highlight' : ''}`}
                >
                  <div className="chat-bubble-meta">
                    {note.senderName} {note.senderRole && note.senderRole !== 'member' ? `(${note.senderRole})` : ''}
                  </div>
                  <div className={`chat-bubble ${isMine ? 'chat-bubble--mine' : ''}`}>
                    {note.statusTitle && <div className="chat-bubble__title">{note.statusTitle}</div>}
                    <p>{note.message}</p>
                  </div>
                  <div className="chat-bubble-time">
                    {note.timestamp?.toDate?.()?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || '...'}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendNote} className="chat-panel__input">
          <input
            type="text"
            className="form-control"
            placeholder={isCompleted ? 'Chat disabled' : 'Type a note...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isCompleted || updatingStatus}
          />
          <button type="submit" className="btn btn-primary" disabled={!newMessage.trim() || isCompleted}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
