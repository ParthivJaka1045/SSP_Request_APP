import React, { useMemo, useState } from 'react';
import { useOpenOrderFromUrl } from '../../hooks/useOpenOrderFromUrl';
import { MessageSquare, Plus } from 'lucide-react';
import { formatDate } from '../../lib/formatDate';
import PageShell from '../../components/layout/PageShell';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import FilterChipGroup from '../../components/ui/FilterChipGroup';
import RequestDetailPanel from '../../components/requests/RequestDetailPanel';
import RequestProgressTimeline from '../../components/requests/RequestProgressTimeline';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceRequests } from '../../hooks/useWorkspaceRequests';
import { TECHNICAL_REQUEST_STATUS } from '../../constants/technicalRequest';
import { MODULES } from '../../constants/modules';

const STATUS_OPTIONS = [
  { id: '', label: 'All' },
  { id: TECHNICAL_REQUEST_STATUS.Submitted, label: 'Submitted' },
  { id: TECHNICAL_REQUEST_STATUS.Approved, label: 'Approved' },
  { id: TECHNICAL_REQUEST_STATUS.InProgress, label: 'In progress' },
  { id: TECHNICAL_REQUEST_STATUS.Completed, label: 'Completed' },
  { id: TECHNICAL_REQUEST_STATUS.Rejected, label: 'Rejected' },
];

const MODULE_CHIPS = MODULES.map((m) => ({ id: m.id, label: m.shortTitle }));

export default function MemberOrdersWorkspace() {
  const { currentUser, activeRole } = useAuth();
  const { requests, loading } = useWorkspaceRequests(currentUser, activeRole);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { closeOrder, highlightNoteId } = useOpenOrderFromUrl(requests, selectedOrder, setSelectedOrder);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchModule = !moduleFilter || r.moduleId === moduleFilter;
      const hay = [r.finalItemName, r.itemType, r.moduleTitle, r.subStatus].join(' ').toLowerCase();
      return matchStatus && matchModule && (!term || hay.includes(term));
    });
  }, [requests, search, statusFilter, moduleFilter]);

  return (
    <PageShell title="My Orders" backTo="/">
      <div className="orders-toolbar glass-panel panel-padding">
        <div>
          <p className="section-kicker">History</p>
          <h3 style={{ margin: '0.25rem 0 0' }}>My requests</h3>
        </div>
        <div className="orders-toolbar__filters">
          <input className="form-control" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.id || 'all'} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="catalog-filter-row">
        <FilterChipGroup options={MODULE_CHIPS} value={moduleFilter} onChange={setModuleFilter} allLabel="All modules" />
      </div>

      {loading ? (
        <div className="catalog-loading">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel panel-padding" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          No requests yet.
        </div>
      ) : (
        <div className="orders-grid">
          {filtered.map((order) => (
            <article
              key={`${order.moduleId}-${order.id}`}
              className={`order-card stk-card order-card--clickable ${order.status === TECHNICAL_REQUEST_STATUS.Completed ? 'order-card--completed' : ''}`}
              onClick={() => setSelectedOrder(order)}
              role="button"
              tabIndex={0}
            >
              <div className="order-card__meta">
                <div><span>Date</span><strong>{formatDate(order.createdAt)}</strong></div>
              </div>
              <div className="order-card__head">
                <div>
                  <p className="order-card__module">{order.moduleTitle}</p>
                  <h4>{order.finalItemName || order.itemType}</h4>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <RequestProgressTimeline request={order} compact />
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', width: 'fit-content' }}>
                <MessageSquare size={14} /> Notes & tracking
              </button>
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
        description={selectedOrder?.moduleTitle}
        onClose={closeOrder}
      >
        {selectedOrder && (
          <RequestDetailPanel
            key={`${selectedOrder.moduleId}-${selectedOrder.id}`}
            requestId={selectedOrder.id}
            moduleId={selectedOrder.moduleId}
            compact
            highlightNoteId={highlightNoteId}
          />
        )}
      </Modal>
    </PageShell>
  );
}
