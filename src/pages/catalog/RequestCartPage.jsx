import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Trash2, Send, Edit2 } from 'lucide-react';
import { db } from '../../firebase';
import PageShell from '../../components/layout/PageShell';
import { useRequestCart } from '../../contexts/RequestCartContext';
import { useAuth } from '../../contexts/AuthContext';
import { getModuleById } from '../../constants/modules';
import { formatDate } from '../../lib/formatDate';
import { getPrimaryImage } from '../../lib/itemMedia';
import { Navigate } from 'react-router-dom';
import { SSP_ROLES } from '../../lib/permissions';
import { notifyNewRequest } from '../../lib/requestActions';

export default function RequestCartPage() {
  const { cartItems, removeDraft, clearCart } = useRequestCart();
  const { currentUser, activeRole } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (activeRole !== SSP_ROLES.member && activeRole !== SSP_ROLES.admin) {
    return <Navigate to="/" replace />;
  }

  const handleSubmitAll = async () => {
    if (!cartItems.length || !currentUser) return;
    setSubmitting(true);
    try {
      const cartRef = await addDoc(collection(db, 'request_carts'), {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name || currentUser.email?.split('@')[0],
        itemCount: cartItems.length,
        createdAt: serverTimestamp(),
      });
      const cartId = cartRef.id;

      for (const entry of cartItems) {
        const mod = getModuleById(entry.moduleId);
        const requestPayload = {
          ...entry.requestDraft,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name || currentUser.email?.split('@')[0],
          itemId: entry.itemId,
          cartId,
          category: entry.moduleId,
          createdAt: serverTimestamp(),
        };
        const requestRef = await addDoc(collection(db, mod.collection), requestPayload);
        await notifyNewRequest({ id: requestRef.id, ...requestPayload }, mod);
      }

      clearCart();
      navigate('/', { state: { cartSuccess: true } });
    } catch (e) {
      console.error(e);
      alert('Failed to submit requests. Please try again.');
    }
    setSubmitting(false);
  };

  if (!cartItems.length) {
    return (
      <PageShell title="Request Cart" subtitle="Combine requests from all modules and submit together." backTo="/">
        <div className="glass-panel panel-padding catalog-empty">
          <p>Your cart is empty. Open any module catalog, pick an item, and complete the full request form to add it here.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Request Cart"
      subtitle="Review full request details from all modules, then submit together."
      backTo="/"
    >
      <div className="bundle-review-list">
        {cartItems.map((entry) => {
          const mod = getModuleById(entry.moduleId);
          const d = entry.requestDraft || {};
          return (
            <div key={entry.key} className="bundle-review-row glass-panel cart-draft-row">
              <img src={getPrimaryImage(entry)} alt="" className="bundle-review-row__img" />
              <div className="bundle-review-row__body">
                <span className="bundle-review-row__module">{mod.shortTitle}</span>
                <strong>{entry.itemName}</strong>
                <div className="cart-draft-details">
                  <p><span>Type:</span> {d.requestType || '—'}</p>
                  <p><span>Needed by:</span> {d.neededByDate ? formatDate(d.neededByDate) : '—'}</p>
                  <p><span>Urgency:</span> {d.urgency || '—'}</p>
                  <p><span>Justification:</span> {d.justification || '—'}</p>
                  {d.comments && <p><span>Comments:</span> {d.comments}</p>}
                  {d.referenceUrl && <p><span>Reference:</span> {d.referenceUrl}</p>}
                </div>
              </div>
              <div className="cart-draft-actions">
                <Link
                  to={`${mod.basePath}/request/new?itemId=${entry.itemId}&cart=1&editKey=${entry.key}`}
                  className="btn btn-secondary btn-sm"
                >
                  <Edit2 size={14} /> Edit
                </Link>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDraft(entry.key)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: '1.5rem', width: '100%' }}
        disabled={submitting}
        onClick={handleSubmitAll}
      >
        <Send size={18} /> {submitting ? 'Submitting...' : `Submit all ${cartItems.length} request(s)`}
      </button>
    </PageShell>
  );
}
