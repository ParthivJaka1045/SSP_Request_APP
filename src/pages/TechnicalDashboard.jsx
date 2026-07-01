import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TECHNICAL_REQUEST_STATUS, normalizeTechnicalStatus } from '../constants/technicalRequest';
import PageShell from '../components/layout/PageShell';
import { canCreateTechnicalRequest } from '../lib/permissions';
import { formatDate } from '../lib/formatDate';

export default function TechnicalDashboard() {
  const { currentUser, hasRole } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) fetchRequests();
  }, [currentUser]);

  const fetchRequests = async () => {
    try {
      const requestsRef = collection(db, 'technical_requests');
      let q;

      if (hasRole('member') && !hasRole('admin') && !hasRole('hod') && !hasRole('santo')) {
        q = query(requestsRef, where('userId', '==', currentUser.id));
      } else if (hasRole('santo') && !hasRole('admin') && !hasRole('hod')) {
        q = query(requestsRef, where('assignedToUserId', '==', currentUser.id));
      } else {
        q = query(requestsRef);
      }

      const querySnapshot = await getDocs(q);
      const reqs = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        reqs.push({
          id: docSnap.id,
          ...data,
          status: normalizeTechnicalStatus(data.status),
        });
      });

      reqs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setRequests(reqs);
    } catch (error) {
      console.error('Error fetching requests: ', error);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case TECHNICAL_REQUEST_STATUS.Approved:
      case TECHNICAL_REQUEST_STATUS.Completed:
        return <CheckCircle size={18} color="var(--accent-secondary)" />;
      case TECHNICAL_REQUEST_STATUS.Rejected:
        return <XCircle size={18} color="var(--accent-danger)" />;
      case TECHNICAL_REQUEST_STATUS.InProgress:
        return <Clock size={18} color="var(--accent-warning)" />;
      default:
        return <AlertCircle size={18} color="var(--accent-info)" />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High (Red)':
        return 'var(--accent-danger)';
      case 'Medium (Blue)':
        return 'var(--accent-info)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const headerActions =
    canCreateTechnicalRequest(currentUser) && hasRole('member') ? (
      <button
        onClick={() => navigate('/technical/new')}
        className="btn btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Plus size={20} /> New Request
      </button>
    ) : null;

  return (
    <PageShell
      title="Technical Requests"
      subtitle="Manage and track your technical hardware requests."
      backTo="/"
      actions={headerActions}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="glass-panel panel-padding" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>No requests found</h3>
          <p>You have not submitted any technical requests yet.</p>
        </div>
      ) : (
        <div className="tech-dashboard-grid">
          {requests.map((req) => (
            <div
              key={req.id}
              className="glass-panel hover-scale"
              onClick={() => navigate(`/request/${req.id}`)}
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'pointer',
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/request/${req.id}`)}
            >
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '130px', color: 'var(--ink)', flexShrink: 0 }}>Username :</strong>
                <span style={{ color: 'var(--accent)', wordBreak: 'break-all', textTransform: 'capitalize' }}>
                  {req.userName || (req.userEmail ? req.userEmail.split('@')[0] : 'Unknown')}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                <strong style={{ width: '130px', color: 'var(--ink)', flexShrink: 0 }}>Item Name :</strong>
                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                  {req.itemType === 'Other' ? req.customItem : req.itemType}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ width: '130px', flexShrink: 0 }}>Requirement :</strong>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  {req.requestType}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ width: '130px', flexShrink: 0 }}>Urgency :</strong>
                <span className="badge" style={{ border: `1px solid ${getUrgencyColor(req.urgency)}`, color: getUrgencyColor(req.urgency) }}>
                  {req.urgency}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <strong style={{ width: '130px', flexShrink: 0 }}>Needed By :</strong>
                <span>{req.neededByDate ? formatDate(req.neededByDate) : 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <strong style={{ width: '130px', flexShrink: 0 }}>Submitted on :</strong>
                <span>{req.createdAt ? formatDate(req.createdAt) : 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ width: '130px', flexShrink: 0 }}>Status :</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusIcon(req.status)}
                  <span style={{ fontWeight: '500' }}>{req.status}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/request/${req.id}`);
                }}
                className="btn btn-secondary"
                style={{ marginTop: 'auto', width: '100%' }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
