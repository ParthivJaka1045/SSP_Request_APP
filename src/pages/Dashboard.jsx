import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MODULES } from '../constants/modules';
import { useAuth } from '../contexts/AuthContext';
import { useRequestCart } from '../contexts/RequestCartContext';
import { canAccessModule, SSP_ROLES } from '../lib/permissions';
import { Calendar, Package, ArrowRight, ShieldCheck, ClipboardCheck, MessageSquare } from 'lucide-react';
import { formatDate } from '../lib/formatDate';
import PageShell from '../components/layout/PageShell';
import MetricCard from '../components/ui/MetricCard';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { TECHNICAL_REQUEST_STATUS, normalizeTechnicalStatus } from '../constants/technicalRequest';
import { buildRequestMetrics } from '../lib/reportSelectors';
import { isCurrentMonth } from '../lib/utils/reportUtils';
import { getModuleById } from '../constants/modules';

const MODULE_BANNERS = {
  technical: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  general: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
  subscription: 'https://images.unsplash.com/photo-1574375927938-d5a98e8d0f70?w=600&q=80',
  travel: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',
};

const ADMIN_METRICS = [
  { key: 'total', label: 'Total orders (month)', accent: 'primary', status: null },
  { key: 'pending', label: 'Pending', accent: 'accent', status: TECHNICAL_REQUEST_STATUS.Submitted },
  { key: 'approved', label: 'Approved', accent: 'primary', status: TECHNICAL_REQUEST_STATUS.Approved },
  { key: 'rejected', label: 'Rejected', accent: 'danger', status: TECHNICAL_REQUEST_STATUS.Rejected },
  { key: 'completed', label: 'Completed', accent: 'success', status: TECHNICAL_REQUEST_STATUS.Completed },
];

export default function Dashboard() {
  const { currentUser, activeRole } = useAuth();
  const navigate = useNavigate();
  const { totalCount } = useRequestCart();
  const isAdmin = activeRole === SSP_ROLES.admin;
  const isHod = activeRole === SSP_ROLES.hod;
  const showAdminDashboard = isAdmin || isHod;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(showAdminDashboard);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    if (activeRole === SSP_ROLES.santo || activeRole === SSP_ROLES.coordinator) {
      navigate('/orders', { replace: true });
    }
  }, [activeRole, navigate]);

  useEffect(() => {
    if (!showAdminDashboard) return;
    (async () => {
      setLoading(true);
      try {
        const snaps = await Promise.all(MODULES.map((m) => getDocs(collection(db, m.collection))));
        const list = [];
        snaps.forEach((snap, idx) => {
          const moduleId = MODULES[idx].id;
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              ...data,
              moduleId,
              category: data.category || moduleId,
              status: normalizeTechnicalStatus(data.status),
            });
          });
        });
        setOrders(list);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [showAdminDashboard]);

  const currentMonthOrders = orders.filter((o) => isCurrentMonth(o.createdAt));
  const metrics = buildRequestMetrics(currentMonthOrders);

  const focusedOrders =
    selectedStatus && selectedStatus !== 'ALL'
      ? currentMonthOrders.filter((o) => o.status === selectedStatus)
      : currentMonthOrders;

  const modalTitle =
    selectedStatus === 'ALL' ? 'Current month orders' : `${selectedStatus} orders`;

  return (
    <div className="page-shell animate-fade-in">
      <header className="page-header">
        <div className="page-header-titles">
          <p className="section-kicker">Workspace</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        {totalCount > 0 && !showAdminDashboard && (
          <div className="page-header-actions">
            <Link to="/cart" className="btn btn-primary">
              Request Cart ({totalCount})
            </Link>
          </div>
        )}
      </header>

      {showAdminDashboard ? (
        loading ? (
          <div className="catalog-loading">Loading dashboard...</div>
        ) : (
          <>
            <section className="reports-metrics reports-metrics--dashboard">
              {ADMIN_METRICS.map((item) => (
                <MetricCard
                  key={item.key}
                  label={item.label}
                  value={item.key === 'total' ? metrics.total : metrics[item.key] ?? 0}
                  accent={item.accent}
                  onClick={() => {
                    setSelectedStatus(item.status ?? 'ALL');
                    setPopupOpen(true);
                  }}
                />
              ))}
            </section>

            <section className="glass-panel panel-padding dashboard-admin-note">
              <p className="section-kicker">Quick note</p>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Click any metric card above to view a detailed list of orders by status for the current month.
              </p>
            </section>

            <Modal
              open={popupOpen}
              onClose={() => setPopupOpen(false)}
              title={modalTitle}
              description="Click dashboard cards to view current-month report lines."
              fullPage
            >
              {focusedOrders.length === 0 ? (
                <div className="reports-empty-state">
                  <p>No matching orders.</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    This popup will show report rows as current-month orders are created.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="reports-table stk-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Item</th>
                        <th>Module</th>
                        <th>User</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {focusedOrders.map((o) => (
                        <tr key={`${o.moduleId}-${o.id}`}>
                          <td>{formatDate(o.createdAt)}</td>
                          <td>{o.finalItemName || o.itemType}</td>
                          <td>{getModuleById(o.moduleId)?.shortTitle || o.moduleId}</td>
                          <td>{o.userName || o.userEmail}</td>
                          <td><StatusBadge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Modal>
          </>
        )
      ) : (
        <div className="dashboard-module-grid">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const allowed = canAccessModule(currentUser, mod.id, activeRole);
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`dashboard-module-card stk-card stk-card-hover ${!allowed ? 'is-disabled' : ''}`}
                onClick={() => allowed && navigate(mod.directForm ? mod.basePath : mod.basePath)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && allowed && navigate(mod.basePath)}
              >
                <div
                  className="dashboard-module-card__banner"
                  style={{ backgroundImage: `url(${MODULE_BANNERS[mod.id]})` }}
                />
                <div className="dashboard-module-card__body">
                  <div className="dashboard-module-card__head">
                    <Icon size={22} style={{ color: mod.accent }} />
                    <h2>{mod.title}</h2>
                  </div>
                  <p>{mod.description}</p>
                  {!allowed && <span className="badge badge-warning">No access</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
