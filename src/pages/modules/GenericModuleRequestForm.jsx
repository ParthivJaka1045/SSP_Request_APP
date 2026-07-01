import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Save, ShoppingCart } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyNewRequest } from '../../lib/requestActions';
import PageShell from '../../components/layout/PageShell';
import RequestProductLayout from '../../components/catalog/RequestProductLayout';
import { getModuleById } from '../../constants/modules';
import { TECHNICAL_REQUEST_STATUS } from '../../constants/technicalRequest';
import { useRequestCart } from '../../contexts/RequestCartContext';
import { getPrimaryImage } from '../../lib/itemMedia';

export default function GenericModuleRequestForm({ moduleId }) {
  const mod = getModuleById(moduleId);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemIdParam = searchParams.get('itemId');
  const cartMode = searchParams.get('cart') === '1';
  const editKey = searchParams.get('editKey');
  const { addDraft, updateDraft, cartItems } = useRequestCart();

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemName, setItemName] = useState(searchParams.get('item') || '');
  const [justification, setJustification] = useState('');
  const [comments, setComments] = useState('');
  const [urgency, setUrgency] = useState('Low');
  const [quantity, setQuantity] = useState('1');
  const [alternative, setAlternative] = useState('No');
  const [durationFrom, setDurationFrom] = useState('');
  const [durationTo, setDurationTo] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemIdParam) return;
    getDoc(doc(db, 'items', itemIdParam)).then((snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setSelectedItem(data);
        setItemName(data.name);
      }
    });
  }, [itemIdParam]);

  useEffect(() => {
    if (!editKey) return;
    const existing = cartItems.find((c) => c.key === editKey);
    if (existing?.requestDraft) {
      const d = existing.requestDraft;
      setItemName(d.finalItemName || existing.itemName);
      setJustification(d.justification || '');
      setComments(d.comments || '');
      setUrgency(d.urgency || 'Low');
      setQuantity(d.quantity || '1');
      setAlternative(d.alternative || 'No');
      setDurationFrom(d.durationFrom || '');
      setDurationTo(d.durationTo || '');
      setCost(d.cost || '');
    }
  }, [editKey, cartItems]);

  const buildPayload = () => {
    const base = {
      requestType: 'New Requirement',
      itemType: itemName.trim(),
      finalItemName: itemName.trim(),
      urgency,
      status: TECHNICAL_REQUEST_STATUS.Submitted,
      category: mod.id,
    };
    if (mod.id === 'subscription') {
      return { ...base, durationFrom, durationTo, cost, justification };
    }
    if (mod.id === 'general') {
      return { ...base, quantity, alternative, comments };
    }
    return base;
  };

  const submitRequest = async (isCartAction = false) => {
    if (!itemName.trim()) return;
    if (mod.id === 'subscription' && !justification.trim()) return;

    setLoading(true);
    try {
      const requestData = buildPayload();

      if (cartMode || isCartAction) {
        const entry = {
          moduleId: mod.id,
          itemId: selectedItem?.id || itemIdParam || 'custom',
          itemName: itemName.trim(),
          imageUrl: getPrimaryImage(selectedItem || {}),
          description: selectedItem?.description,
          requestDraft: requestData,
        };
        if (editKey) updateDraft(editKey, entry);
        else addDraft(entry);
        navigate('/cart');
        setLoading(false);
        return;
      }

      const userName = currentUser.name || currentUser.email?.split('@')[0];
      const docRef = await addDoc(collection(db, mod.collection), {
        ...requestData,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        createdAt: serverTimestamp(),
      });

      try {
        await notifyNewRequest({ id: docRef.id, ...requestData, category: mod.id, userName }, mod);
      } catch (e) {
        console.error(e);
      }

      navigate(mod.basePath);
    } catch (err) {
      console.error(err);
      alert('Failed to submit request.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitRequest(false);
  };

  const title = cartMode ? 'Add to Request Cart — full details' : `New ${mod.shortTitle} Request`;

  return (
    <PageShell title={title} backTo={cartMode ? '/cart' : mod.basePath}>
      <RequestProductLayout item={selectedItem} moduleTitle={mod.shortTitle}>
        <form onSubmit={handleSubmit} className="glass-panel panel-padding">
          <div className="form-group">
            <label className="form-label">Item / Subject *</label>
            <input
              className="form-control"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              disabled={Boolean(itemIdParam && selectedItem)}
            />
          </div>

          {mod.id === 'general' && (
            <>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input type="number" min="1" className="form-control" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Alternative acceptable *</label>
                <select className="form-control" value={alternative} onChange={(e) => setAlternative(e.target.value)} required>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Additional comments</label>
                <textarea className="form-control" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
              </div>
            </>
          )}

          {mod.id === 'subscription' && (
            <>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Required duration — from *</label>
                  <input type="date" className="form-control" value={durationFrom} onChange={(e) => setDurationFrom(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Required duration — to *</label>
                  <input type="date" className="form-control" value={durationTo} onChange={(e) => setDurationTo(e.target.value)} required min={durationFrom || undefined} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cost *</label>
                <input type="text" className="form-control" placeholder="e.g. ₹999 / year" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Justification *</label>
                <textarea className="form-control" rows={4} value={justification} onChange={(e) => setJustification(e.target.value)} required />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Urgency level</label>
            <select className="form-control" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>

          {cartMode ? (
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              <ShoppingCart size={18} /> {loading ? 'Saving...' : 'Add to Request Cart'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={loading}
                onClick={() => submitRequest(true)}
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                <Save size={18} /> {loading ? 'Submitting...' : 'Direct Buy'}
              </button>
            </div>
          )}
        </form>
      </RequestProductLayout>
    </PageShell>
  );
}
