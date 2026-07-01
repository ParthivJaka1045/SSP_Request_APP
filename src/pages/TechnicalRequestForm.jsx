import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, where, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, AlertCircle, ShoppingCart } from 'lucide-react';
import { notifyNewRequest } from '../lib/requestActions';
import { TECHNICAL_REQUEST_STATUS } from '../constants/technicalRequest';
import { TECH_LABELS, TECH_PLACEHOLDERS } from '../lib/labels/technical';
import FormLabel, { HintText } from '../components/ui/FormLabel';
import PageShell from '../components/layout/PageShell';
import RequestProductLayout from '../components/catalog/RequestProductLayout';
import UserAddItemPanel from '../components/catalog/UserAddItemPanel';
import { filterActiveItems, filterCatalogItems, findItemByName, sortItemsByName } from '../lib/items';
import { useRequestCart } from '../contexts/RequestCartContext';
import { getPrimaryImage } from '../lib/itemMedia';
import { subscribeModuleSettings, canUserAddItems } from '../lib/moduleSettings';

export default function TechnicalRequestForm() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemIdParam = searchParams.get('itemId');
  const cartMode = searchParams.get('cart') === '1';
  const editKey = searchParams.get('editKey');
  const flow = searchParams.get('flow');

  const { addDraft, updateDraft, cartItems } = useRequestCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [moduleSettings, setModuleSettings] = useState(null);
  const [itemsRefreshKey, setItemsRefreshKey] = useState(0);

  const [availableItems, setAvailableItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');

  const [itemType, setItemType] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [comments, setComments] = useState('');
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState('Low');

  const requestType = 'New Requirement';
  const showUserAddItem = moduleSettings && canUserAddItems(moduleSettings, 'technical');
  const backTo = flow ? `/technical?flow=${flow}&view=catalog` : cartMode ? '/cart' : '/technical';

  useEffect(() => {
    return subscribeModuleSettings(setModuleSettings);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [itemsRefreshKey]);

  useEffect(() => {
    if (editKey) {
      const existing = cartItems.find((c) => c.key === editKey);
      if (existing?.requestDraft) {
        const d = existing.requestDraft;
        setItemType(d.itemType || existing.itemName);
        setCustomItem(d.customItem || '');
        setComments(d.comments || '');
        setJustification(d.justification || '');
        setUrgency(d.urgency || 'Low');
        setSelectedItem({ id: existing.itemId, name: existing.itemName, imageUrl: existing.imageUrl });
      }
    }
  }, [editKey, cartItems]);

  useEffect(() => {
    if (!itemIdParam || availableItems.length === 0) return;
    const fromList = availableItems.find((i) => i.id === itemIdParam);
    if (fromList) {
      setSelectedItem(fromList);
      setItemType(fromList.name);
      return;
    }
    getDoc(doc(db, 'items', itemIdParam)).then((snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        if (data.replacementOnly) return;
        setSelectedItem(data);
        setItemType(data.name);
      }
    });
  }, [itemIdParam, availableItems]);

  const fetchItems = async () => {
    try {
      const itemsRef = collection(db, 'items');
      const q = query(itemsRef, where('category', '==', 'technical'));
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      const activeOnly = sortItemsByName(filterCatalogItems(filterActiveItems(items)));
      setAvailableItems(activeOnly);
      if (!itemIdParam && activeOnly.length > 0 && !itemType) {
        setItemType(activeOnly[0].name);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const filteredItems = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    if (!term) return availableItems;
    return availableItems.filter((i) => String(i.name || '').toLowerCase().includes(term));
  }, [availableItems, itemSearch]);

  const buildRequestPayload = () => {
    const itemNameForPayload = itemType === 'Other' ? customItem.trim() : itemType;
    return {
      requestType,
      itemType: itemNameForPayload,
      customItem: customItem.trim(),
      finalItemName: itemNameForPayload,
      comments: comments.trim(),
      justification: justification.trim(),
      urgency,
      status: TECHNICAL_REQUEST_STATUS.Submitted,
      category: 'technical',
    };
  };

  const handleSubmit = async (e, isCartAction = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestData = buildRequestPayload();
      const resolvedItem = selectedItem || availableItems.find((i) => i.name === itemType);
      const resolvedItemId = resolvedItem?.id || itemIdParam || 'other';
      const resolvedName = requestData.finalItemName;

      if (itemType === 'Other' && customItem.trim()) {
        const existing = findItemByName(availableItems, customItem);
        if (!existing) {
          await addDoc(collection(db, 'items'), {
            name: customItem.trim(),
            category: 'technical',
            isActive: true,
            pendingAdminReview: true,
            createdByUserId: currentUser.id,
            createdByEmail: currentUser.email,
            createdAt: serverTimestamp(),
          });
        }
      }

      if (cartMode || isCartAction) {
        const entry = {
          moduleId: 'technical',
          itemId: resolvedItemId,
          itemName: resolvedName,
          imageUrl: getPrimaryImage(resolvedItem || {}),
          description: resolvedItem?.description,
          requestDraft: requestData,
        };
        if (editKey) updateDraft(editKey, entry);
        else addDraft(entry);
        navigate('/cart');
        setLoading(false);
        return;
      }

      const userName = currentUser.name || currentUser.email.split('@')[0];
      const docRef = await addDoc(collection(db, 'technical_requests'), {
        ...requestData,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        itemId: resolvedItemId !== 'other' ? resolvedItemId : null,
        createdAt: serverTimestamp(),
      });

      try {
        await notifyNewRequest({ id: docRef.id, ...requestData, category: 'technical', userName }, { title: 'Technical' });
      } catch (notifyErr) {
        console.error('Failed to notify admins', notifyErr);
      }

      navigate(flow ? `/technical?flow=${flow}&view=catalog` : '/technical');
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request. Please try again.');
    }
    setLoading(false);
  };

  const title = cartMode
    ? editKey ? 'Edit request in cart' : 'Add to Request Cart'
    : 'New Requirement Request';

  const displayItem = selectedItem || availableItems.find((i) => i.name === itemType);

  return (
    <PageShell title={title} backTo={backTo}>
      <RequestProductLayout
        item={displayItem}
        moduleTitle="Technical"
        topSlot={
          showUserAddItem && !itemIdParam ? (
            <UserAddItemPanel
              moduleId="technical"
              itemsCategory="technical"
              currentUser={currentUser}
              onAdded={(item) => {
                setItemsRefreshKey((k) => k + 1);
                setSelectedItem(item);
                setItemType(item.name);
              }}
            />
          ) : null
        }
      >
        {error && (
          <div className="badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel panel-padding">
          <div className="form-group">
            <FormLabel label={TECH_LABELS.requestType} />
            <div className="request-type-locked">{requestType}</div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <FormLabel label={TECH_LABELS.selectItem} required />
              {!itemIdParam && (
                <input
                  type="search"
                  className="form-control"
                  style={{ marginBottom: '0.5rem' }}
                  placeholder="Search item..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              )}
              <select
                className="form-control"
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value);
                  const found = availableItems.find((i) => i.name === e.target.value);
                  if (found) setSelectedItem(found);
                }}
                required
                disabled={Boolean(itemIdParam && selectedItem)}
              >
                {filteredItems.length === 0 && <option value="">— No items —</option>}
                {filteredItems.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
                {!itemIdParam && showUserAddItem && <option value="Other">{TECH_LABELS.itemNotListed.en}</option>}
              </select>
            </div>
          </div>

          {itemType === 'Other' && (
            <div className="form-group animate-fade-in" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <FormLabel label={TECH_LABELS.describeItem} required />
              <HintText text={TECH_LABELS.otherItemHint} variant="info" />
              <input type="text" className="form-control" placeholder={TECH_PLACEHOLDERS.customItem.en} value={customItem} onChange={(e) => setCustomItem(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <FormLabel label={TECH_LABELS.urgencyLevel} />
            <select className="form-control" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>

          <div className="form-group">
            <FormLabel label={TECH_LABELS.justification} required />
            <textarea className="form-control" rows="3" placeholder={TECH_PLACEHOLDERS.justification.en} value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>

          <div className="form-group">
            <FormLabel label={{ en: 'Specs / Additional Comments' }} />
            <textarea className="form-control" rows="2" placeholder="Technical specifications or other details" value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>

          {cartMode ? (
            <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <ShoppingCart size={18} /> {loading ? 'Saving...' : editKey ? 'Update in Request Cart' : 'Add to Request Cart'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                disabled={loading}
                type="button"
                onClick={(e) => {
                  const form = e.target.closest('form');
                  if (form && form.reportValidity()) handleSubmit(e, true);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button disabled={loading} type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Save size={18} /> {loading ? TECH_LABELS.submitting.en : 'Direct Buy'}
              </button>
            </div>
          )}
        </form>
      </RequestProductLayout>
    </PageShell>
  );
}
