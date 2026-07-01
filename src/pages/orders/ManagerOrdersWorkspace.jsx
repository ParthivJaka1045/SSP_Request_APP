import React, { useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useOpenOrderFromUrl } from '../../hooks/useOpenOrderFromUrl';
import { MessageSquare, Clock, User, Tag, UserCheck, Inbox } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import FilterChipGroup from '../../components/ui/FilterChipGroup';
import RequestDetailPanel from '../../components/requests/RequestDetailPanel';
import InProgressSubStatusPicker from '../../components/requests/InProgressSubStatusPicker';
import RequestProgressTimeline from '../../components/requests/RequestProgressTimeline';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceRequests } from '../../hooks/useWorkspaceRequests';
import { updateRequestStatus } from '../../lib/requestActions';
import { TECHNICAL_REQUEST_STATUS, TECHNICAL_REQUEST_SUBSTATUS } from '../../constants/technicalRequest';
import { MODULES } from '../../constants/modules';
import { canManageRequestStatus, canAdvanceRequestStatus, canRejectRequest, canMarkRequestSeen, canCoordinatorTriage } from '../../lib/permissions';
import { sortRequestsByUrgency, getUrgencyBadgeClass, parseUrgency } from '../../lib/urgency';

const STATUS_OPTIONS = [
  { id: '', label: 'All' },
  { id: TECHNICAL_REQUEST_STATUS.Submitted, label: 'Submitted' },
  { id: TECHNICAL_REQUEST_STATUS.Seen, label: 'Seen' },
  { id: TECHNICAL_REQUEST_STATUS.Approved, label: 'Approved' },
  { id: TECHNICAL_REQUEST_STATUS.InProgress, label: 'In progress' },
  { id: TECHNICAL_REQUEST_STATUS.Completed, label: 'Completed' },
  { id: TECHNICAL_REQUEST_STATUS.Rejected, label: 'Rejected' },
];

const COORDINATOR_STATUS_OPTIONS = [
  { id: '', label: 'All' },
  { id: TECHNICAL_REQUEST_STATUS.Submitted, label: 'Submitted' },
  { id: TECHNICAL_REQUEST_STATUS.Seen, label: 'Seen' },
];

const MODULE_CHIPS = MODULES.map((m) => ({ id: m.id, label: m.shortTitle }));

const REJECT_OPTIONS = [
  { value: TECHNICAL_REQUEST_SUBSTATUS.MoreInfo, label: 'More Information Request' },
  { value: 'Other', label: 'Other' },
];

export default function ManagerOrdersWorkspace() {
  const { currentUser, activeRole } = useAuth();
  const { requests, loading, refresh } = useWorkspaceRequests(currentUser, activeRole);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const location = useLocation();
  const viewMode = location.pathname.includes('/assigned') ? 'assigned' : 'all';
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { closeOrder, highlightNoteId } = useOpenOrderFromUrl(requests, selectedOrder, setSelectedOrder);
  const [inProgressSub, setInProgressSub] = useState(TECHNICAL_REQUEST_SUBSTATUS.AlternateSuggestions);
  const [rejectSub, setRejectSub] = useState(TECHNICAL_REQUEST_SUBSTATUS.MoreInfo);

  const canManage = canManageRequestStatus(currentUser, activeRole);
  const canAdvance = canAdvanceRequestStatus(currentUser, activeRole);
  const isCoordinator = canCoordinatorTriage(currentUser, activeRole);
  const canReject = canRejectRequest(currentUser, activeRole);
  const canMarkSeen = canMarkRequestSeen(currentUser, activeRole);
  const statusOptions = isCoordinator ? COORDINATOR_STATUS_OPTIONS : STATUS_OPTIONS;

  const isAssignedView = viewMode === 'assigned';
  const showAssignedFilter = activeRole === 'santo' || activeRole === 'hod';

  const isAssignedToMe = useCallback(
    (order) =>
      order.assignedToUserId === currentUser.id
      || (Array.isArray(order.assignedToUsers) && order.assignedToUsers.some((u) => u.id === currentUser.id)),
    [currentUser],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (isAssignedView && showAssignedFilter) {
        if (!isAssignedToMe(r)) return false;
      }
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchModule = !moduleFilter || r.moduleId === moduleFilter;
      const hay = [
        r.finalItemName, r.itemType, r.userName, r.userEmail,
        r.moduleTitle, r.justification, r.comments, r.subStatus,
      ].join(' ').toLowerCase();
      return matchStatus && matchModule && (!term || hay.includes(term));
    });
  }, [requests, search, statusFilter, moduleFilter, isAssignedView, showAssignedFilter, isAssignedToMe]);

  const assignedCount = useMemo(
    () => requests.filter(isAssignedToMe).length,
    [requests, isAssignedToMe],
  );

  const sortedFiltered = useMemo(() => {
    return sortRequestsByUrgency(filtered);
  }, [filtered]);

  const runDecision = async (extra = {}) => {
    if (!decision) return;
    setSubmitting(true);
    try {
      await updateRequestStatus(decision.request, {
        status: decision.nextStatus,
        subStatus: extra.subStatus,
        note: decisionNote,
        actor: {
          id: currentUser.id,
          name: currentUser.name || currentUser.email,
          email: currentUser.email,
          role: activeRole,
        },
      });
      await refresh();
      setDecision(null);
      setDecisionNote('');
      if (selectedOrder?.id === decision.request.id) {
        setSelectedOrder(null);
        setTimeout(() => setSelectedOrder(decision.request), 50);
      }
    } catch (e) {
      console.error(e);
      alert('Could not update request.');
    }
    setSubmitting(false);
  };

  const openOrder = (order) => setSelectedOrder(order);

  return (
    <PageShell title={isAssignedView ? 'Assign To Me' : 'Orders'} backTo="/">
        <div className="orders-toolbar glass-panel panel-padding">
          <div>
            <p className="section-kicker">{isAssignedView ? 'My assignments' : 'Manage'}</p>
            <h3 style={{ margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isAssignedView ? (
                <>
                  <Inbox size={22} />
                  Assigned to me
                  {assignedCount > 0 && <span className="orders-count-badge">{assignedCount}</span>}
                </>
              ) : (
                'Review requests'
              )}
            </h3>
            {isAssignedView && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Orders forwarded to you by triage staff appear here.
              </p>
            )}
          </div>
          <div className="orders-toolbar__filters">
          <input className="form-control" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map((o) => (
              <option key={o.id || 'all'} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="catalog-filter-row">
        <FilterChipGroup options={MODULE_CHIPS} value={moduleFilter} onChange={setModuleFilter} allLabel="All modules" />
      </div>

      {loading ? (
        <div className="catalog-loading">Loading orders...</div>
      ) : sortedFiltered.length === 0 ? (
        <div className="glass-panel panel-padding orders-empty-state">
          <Inbox size={40} strokeWidth={1.5} />
          <h4>{isAssignedView ? 'No assignments yet' : 'No requests match your filters'}</h4>
          <p>{isAssignedView ? 'When an order is assigned to you, it will appear here and you will get a notification.' : 'Try adjusting your search or filters.'}</p>
        </div>
      ) : (
        <div className="orders-grid">
          {sortedFiltered.map((order) => (
            <article
              key={`${order.moduleId}-${order.id}`}
              className={`order-card stk-card order-card--clickable ${order.status === TECHNICAL_REQUEST_STATUS.Completed ? 'order-card--completed' : ''} ${!isAssignedView && isAssignedToMe(order) ? 'order-card--assigned-to-me' : ''}`}
              onClick={() => openOrder(order)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openOrder(order)}
            >
              <div className={getUrgencyBadgeClass(order.urgency)}>
                {parseUrgency(order.urgency)}
              </div>
              <div className="order-card__head">
                <div>
                  <p className="order-card__module">{order.moduleTitle || order.moduleId}</p>
                  <h4>{order.finalItemName || order.itemType || '—'}</h4>
                  <div className="order-card__highlights">
                    <span className="highlight-tag highlight-user">
                      <User size={14} /> {order.userName && order.userName.trim() !== '' ? order.userName : 'Member'}
                    </span>
                    <span className="highlight-tag highlight-time">
                      <Clock size={14} /> {order.createdAt?.toDate?.()?.toLocaleString?.('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || '—'}
                    </span>
                    {!isAssignedView && isAssignedToMe(order) && (
                      <span className="highlight-tag highlight-assigned">
                        <UserCheck size={14} /> Assigned to me
                      </span>
                    )}
                  </div>
                  {order.assignedToUsers?.length > 0 && (
                    <div className="order-card__assignees">
                      <Tag size={12} />
                      {order.assignedToUsers.map((u) => u.name || u.santoTag || u.email).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
                <StatusBadge status={order.status} />
              </div>
              {order.status === TECHNICAL_REQUEST_STATUS.InProgress && order.subStatus && (
                <p className="order-card__substatus">{order.subStatus}</p>
              )}

              <RequestProgressTimeline request={order} compact />


              <div className="order-card__actions" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openOrder(order)}>
                  <MessageSquare size={14} /> Notes & details
                </button>
                {canManage && canMarkSeen && order.status === TECHNICAL_REQUEST_STATUS.Submitted && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDecision({ request: order, nextStatus: TECHNICAL_REQUEST_STATUS.Seen })}>Mark Seen</button>
                )}
                {canManage && canAdvance && order.status === TECHNICAL_REQUEST_STATUS.Seen && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDecision({ request: order, nextStatus: TECHNICAL_REQUEST_STATUS.Approved })}>Approve</button>
                )}
                {canManage && canAdvance && order.status === TECHNICAL_REQUEST_STATUS.Approved && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDecision({ request: order, nextStatus: TECHNICAL_REQUEST_STATUS.InProgress, showSub: true, type: 'progress' })}>In progress</button>
                )}
                {canManage && canAdvance && order.status === TECHNICAL_REQUEST_STATUS.InProgress && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setDecision({ request: order, nextStatus: TECHNICAL_REQUEST_STATUS.Completed })}>Complete</button>
                )}
                {canManage && canReject && (order.status !== TECHNICAL_REQUEST_STATUS.Completed && order.status !== TECHNICAL_REQUEST_STATUS.Rejected) && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setDecision({ request: order, nextStatus: TECHNICAL_REQUEST_STATUS.Rejected, type: 'reject' })}>Reject</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        wide
        fullPage
        hideFooter
        open={Boolean(selectedOrder)}
        title={selectedOrder?.finalItemName || selectedOrder?.itemType || 'Request'}
        description={selectedOrder ? `${selectedOrder.moduleTitle} · ${selectedOrder.userName || selectedOrder.userEmail}` : ''}
        onClose={closeOrder}
      >
        {selectedOrder && (
          <RequestDetailPanel
            key={`${selectedOrder.moduleId}-${selectedOrder.id}`}
            requestId={selectedOrder.id}
            moduleId={selectedOrder.moduleId}
            compact
            onUpdated={() => refresh()}
            highlightNoteId={highlightNoteId}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(decision)}
        title={decision?.nextStatus === TECHNICAL_REQUEST_STATUS.InProgress ? 'Set in progress' : `Mark as ${decision?.nextStatus || ''}`}
        description={decision?.request?.finalItemName || decision?.request?.itemType}
        onClose={() => setDecision(null)}
      >
        {decision?.type === 'progress' && (
          <InProgressSubStatusPicker
            value={inProgressSub}
            onChange={setInProgressSub}
            disabled={submitting}
          />
        )}
        {decision?.type === 'reject' && (
          <div className="form-group">
            <label className="form-label">Reason</label>
            <select className="form-control" value={rejectSub} onChange={(e) => setRejectSub(e.target.value)}>
              {REJECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">
            Note
            {(decision?.nextStatus === TECHNICAL_REQUEST_STATUS.Rejected
              || (decision?.type === 'progress' && inProgressSub === TECHNICAL_REQUEST_SUBSTATUS.Other)) && (
              <span style={{ color: 'var(--accent-danger)' }}> (required)</span>
            )}
          </label>
          <textarea className="form-control" rows={3} value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Goes to notes chat with user..." />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              submitting
              || (decision?.type === 'reject' && !decisionNote.trim())
              || (decision?.type === 'progress' && inProgressSub === TECHNICAL_REQUEST_SUBSTATUS.Other && !decisionNote.trim())
            }
            onClick={() => runDecision(decision?.type === 'progress' ? { subStatus: inProgressSub } : decision?.type === 'reject' ? { subStatus: rejectSub } : {})}
          >
            {submitting ? 'Saving...' : 'Confirm'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setDecision(null)}>Cancel</button>
        </div>
      </Modal>
    </PageShell>
  );
}
