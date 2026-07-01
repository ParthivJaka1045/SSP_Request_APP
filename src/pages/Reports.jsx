import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Download } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import MetricCard from '../components/ui/MetricCard';
import SearchableMultiSelect from '../components/ui/SearchableMultiSelect';
import StatusBadge from '../components/ui/StatusBadge';
import { TECHNICAL_REQUEST_STATUS, normalizeTechnicalStatus } from '../constants/technicalRequest';
import {
  buildRequestMetrics,
  buildItemUsageRows,
  buildMemberwiseRows,
  uniqueMonthOptions,
  withinDateRange,
  matchesMonths,
  matchesList,
  matchesCategories,
  getRequestDate,
  resolveUserDisplayName,
} from '../lib/reportSelectors';
import { downloadCsv, isCurrentMonth } from '../lib/utils/reportUtils';
import { canAccessReports, SSP_ROLES } from '../lib/permissions';
import { MODULES, getModuleById } from '../constants/modules';
import { filterRequestsForReport } from '../lib/moduleRequests';

const MODULE_OPTIONS = MODULES.filter((m) => m.id !== 'travel').map((m) => ({ value: m.id, label: m.shortTitle }));
const STATUS_OPTIONS = Object.values(TECHNICAL_REQUEST_STATUS).map((s) => ({ value: s, label: s }));

function ReportPanel({ kicker, title, onExport, children }) {
  return (
    <section className="glass-panel panel-padding reports-stk-panel">
      <div className="reports-stk-panel__head">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h3 className="reports-stk-panel__title">{title}</h3>
        </div>
        {onExport && (
          <button type="button" className="btn btn-secondary" onClick={onExport}>
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Reports() {
  const { currentUser, activeRole } = useAuth();
  const [allReports, setAllReports] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = activeRole === SSP_ROLES.admin;
  const isHod = activeRole === SSP_ROLES.hod;

  const [orderFilters, setOrderFilters] = useState({
    startDate: '',
    endDate: '',
    months: [],
    moduleIds: [],
    statuses: [],
  });

  const [usageFilters, setUsageFilters] = useState({
    category: '',
    month: '',
  });

  const [memberFilters, setMemberFilters] = useState({
    months: [],
    moduleIds: [],
    itemIds: [],
    userEmail: '',
  });

  useEffect(() => {
    if (!canAccessReports(currentUser, activeRole)) return;
    fetchData();
  }, [currentUser, activeRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snaps = await Promise.all(MODULES.map((m) => getDocs(collection(db, m.collection))));
      let reqs = [];
      snaps.forEach((snap, idx) => {
        const moduleId = MODULES[idx].id;
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
      });
      reqs = filterRequestsForReport(reqs, currentUser, activeRole);
      setAllReports(reqs);

      const itemSnap = await getDocs(collection(db, 'items'));
      const itemList = [];
      itemSnap.forEach((d) => itemList.push({ id: d.id, ...d.data() }));
      setItems(itemList);

      if (isAdmin || isHod) {
        const userSnap = await getDocs(collection(db, 'users'));
        const usrs = [];
        userSnap.forEach((d) => usrs.push({ id: d.id, ...d.data() }));
        setUsers(usrs);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const monthOptions = useMemo(
    () => uniqueMonthOptions(allReports).map((v) => ({ value: v, label: v })),
    [allReports],
  );

  const itemOptions = useMemo(
    () => items.map((i) => ({ value: i.id, label: `${i.name} (${getModuleById(i.category)?.shortTitle || i.category})` })),
    [items],
  );

  const usersByEmail = useMemo(() => {
    const map = {};
    users.forEach((u) => { if (u.email) map[u.email] = u; });
    return map;
  }, [users]);

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.email, label: u.name || u.email })),
    [users],
  );

  const displayName = (record) => resolveUserDisplayName(record, usersByEmail);

  const currentMonthRequests = useMemo(
    () => allReports.filter((r) => isCurrentMonth(r.createdAt)),
    [allReports],
  );
  const currentMetrics = useMemo(() => buildRequestMetrics(currentMonthRequests), [currentMonthRequests]);

  const filteredOrders = useMemo(() => {
    return allReports.filter((r) => {
      const dateForRange = getRequestDate(r);
      return (
        withinDateRange(dateForRange, orderFilters.startDate, orderFilters.endDate) &&
        matchesMonths(r.createdAt, orderFilters.months) &&
        matchesCategories(r, orderFilters.moduleIds) &&
        matchesList(r.status, orderFilters.statuses)
      );
    });
  }, [allReports, orderFilters]);

  const usageSource = useMemo(() => {
    return filteredOrders.filter((r) => {
      const mod = r.moduleId || r.category;
      if (mod === 'travel') return false;
      if (usageFilters.category && mod !== usageFilters.category) return false;
      if (usageFilters.month && !matchesMonths(r.createdAt, [usageFilters.month])) return false;
      return true;
    });
  }, [filteredOrders, usageFilters]);

  const usageRows = useMemo(() => buildItemUsageRows(usageSource), [usageSource]);

  const memberRows = useMemo(() => {
    const scoped = allReports.filter((r) => {
      const mod = r.moduleId || r.category;
      if (mod === 'travel') return false;
      const itemName = r.finalItemName || r.itemType;
      const itemMatch = !memberFilters.itemIds.length
        || memberFilters.itemIds.some((id) => {
          const item = items.find((i) => i.id === id);
          return item && item.name === itemName;
        });
      return (
        matchesMonths(r.createdAt, memberFilters.months) &&
        matchesCategories(r, memberFilters.moduleIds) &&
        (!memberFilters.userEmail || r.userEmail === memberFilters.userEmail) &&
        itemMatch
      );
    });
    return buildMemberwiseRows(scoped);
  }, [allReports, memberFilters, items]);

  const reportKicker = isAdmin ? 'Reports Admin' : isHod ? 'Reports HOD' : 'My Reports';
  const orderTitle = isAdmin ? 'Admin order report' : isHod ? 'HOD order report' : 'My requested items';

  const exportOrders = () => {
    downloadCsv(
      isAdmin ? 'admin-order-report.csv' : isHod ? 'hod-order-report.csv' : 'user-order-report.csv',
      filteredOrders.map((row, i) => ({
        'Sr No': i + 1,
        'Item Name': row.finalItemName || row.itemType,
        Module: row.moduleId || row.category,
        Status: row.status,
        User: displayName(row),
      })),
    );
  };

  const exportUsage = () => {
    downloadCsv(
      isAdmin ? 'admin-item-demand.csv' : isHod ? 'hod-item-demand.csv' : 'user-item-demand.csv',
      usageRows.map((r, i) => ({
        'Sr No': i + 1,
        Module: getModuleById(r.category)?.shortTitle || r.category,
        'Item Name': r.itemName,
        'Total Requests': r.total,
      })),
    );
  };

  const exportMember = () => {
    downloadCsv(
      'admin-memberwise-report.csv',
      memberRows.map((r, i) => ({
        'Sr No': i + 1,
        User: displayName({ userName: r.userName, userEmail: r.email }),
        Module: r.category,
        'Item Name': r.itemName,
        'Total Order': r.total,
      })),
    );
  };

  if (!canAccessReports(currentUser, activeRole)) {
    return (
      <PageShell title="Access Denied" backTo="/">
        <p>Please sign in to view reports.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={reportKicker} backTo="/">
      {loading ? (
        <div className="catalog-loading">Loading reports...</div>
      ) : (
        <>
          <section className="reports-metrics">
            {isAdmin ? (
              <>
                <MetricCard label="Current month orders" value={currentMetrics.total} accent="primary" />
                <MetricCard label="Rejected orders" value={currentMetrics.rejected} accent="danger" />
                <MetricCard label="Active users" value={users.filter((u) => u.isActive !== false).length} accent="success" />
              </>
            ) : (
              <MetricCard label="My total requests" value={currentMetrics.total} accent="primary" />
            )}
          </section>

          <ReportPanel kicker={reportKicker} title={orderTitle} onExport={exportOrders}>
            <div className="reports-filters reports-filters--stk">
              <div className="form-group">
                <label className="form-label">From date</label>
                <input type="date" className="form-control" value={orderFilters.startDate} onChange={(e) => setOrderFilters({ ...orderFilters, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">To date</label>
                <input type="date" className="form-control" value={orderFilters.endDate} onChange={(e) => setOrderFilters({ ...orderFilters, endDate: e.target.value })} />
              </div>
              <div className="reports-filter-cards">
                <SearchableMultiSelect label="Months" options={monthOptions} selected={orderFilters.months} onChange={(months) => setOrderFilters({ ...orderFilters, months })} placeholder="Select months" />
                <SearchableMultiSelect label="Modules" options={MODULE_OPTIONS} selected={orderFilters.moduleIds} onChange={(moduleIds) => setOrderFilters({ ...orderFilters, moduleIds })} placeholder="Select modules" />
                <SearchableMultiSelect label="Status" options={STATUS_OPTIONS} selected={orderFilters.statuses} onChange={(statuses) => setOrderFilters({ ...orderFilters, statuses })} placeholder="Select statuses" />
              </div>
            </div>
            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              <table className="reports-table stk-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Item name</th>
                    <th>Module</th>
                    <th>Status</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={5} className="reports-empty">No orders match filters.</td></tr>
                  ) : (
                    filteredOrders.map((row, i) => (
                      <tr key={`${row.moduleId}-${row.id}`}>
                        <td>{i + 1}</td>
                        <td>{row.finalItemName || row.itemType}</td>
                        <td>{getModuleById(row.moduleId || row.category)?.shortTitle || row.moduleId}</td>
                        <td><StatusBadge status={row.status} /></td>
                        <td>{displayName(row)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ReportPanel>

          <ReportPanel kicker={reportKicker} title="Item demand report" onExport={exportUsage}>
            <div className="reports-filters reports-filters--stk">
              <div className="form-group">
                <label className="form-label">Module</label>
                <select className="form-control" value={usageFilters.category} onChange={(e) => setUsageFilters({ ...usageFilters, category: e.target.value })}>
                  <option value="">All modules</option>
                  {MODULE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Month</label>
                <input type="month" className="form-control" value={usageFilters.month} onChange={(e) => setUsageFilters({ ...usageFilters, month: e.target.value })} />
              </div>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sr no</th>
                    <th>Module</th>
                    <th>Item name</th>
                    <th>Total requests</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRows.length === 0 ? (
                    <tr><td colSpan={4} className="reports-empty">No demand data.</td></tr>
                  ) : (
                    usageRows.map((r, i) => (
                      <tr key={`${r.category}-${r.itemName}`}>
                        <td>{i + 1}</td>
                        <td>{getModuleById(r.category)?.shortTitle || r.category}</td>
                        <td>{r.itemName}</td>
                        <td><strong>{r.total}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ReportPanel>

          {isAdmin || isHod ? (
            <ReportPanel kicker={reportKicker} title="Memberwise report" onExport={exportMember}>
              <div className="reports-filters reports-filters--stk">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <select className="form-control" value={memberFilters.userEmail} onChange={(e) => setMemberFilters({ ...memberFilters, userEmail: e.target.value })}>
                    <option value="">All users</option>
                    {userOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div className="reports-filter-cards">
                  <SearchableMultiSelect label="Months" options={monthOptions} selected={memberFilters.months} onChange={(months) => setMemberFilters({ ...memberFilters, months })} placeholder="Select months" />
                  <SearchableMultiSelect label="Modules" options={MODULE_OPTIONS} selected={memberFilters.moduleIds} onChange={(moduleIds) => setMemberFilters({ ...memberFilters, moduleIds })} placeholder="Select modules" />
                  <SearchableMultiSelect label="Items" options={itemOptions} selected={memberFilters.itemIds} onChange={(itemIds) => setMemberFilters({ ...memberFilters, itemIds })} placeholder="Select items" />
                </div>
              </div>
              <div className="table-responsive" style={{ marginTop: '1rem' }}>
                <table className="reports-table stk-table">
                  <thead>
                    <tr>
                      <th>Sr No</th>
                      <th>User</th>
                      <th>Module</th>
                      <th>Item name</th>
                      <th>Total order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberRows.length === 0 ? (
                      <tr><td colSpan={5} className="reports-empty">No memberwise data.</td></tr>
                    ) : (
                      memberRows.map((r, i) => (
                        <tr key={`${r.email}-${r.category}-${r.itemName}`}>
                          <td>{i + 1}</td>
                          <td>{displayName({ userName: r.userName, userEmail: r.email })}</td>
                          <td>{getModuleById(r.category)?.shortTitle || r.category}</td>
                          <td>{r.itemName}</td>
                          <td><strong>{r.total}</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ReportPanel>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
