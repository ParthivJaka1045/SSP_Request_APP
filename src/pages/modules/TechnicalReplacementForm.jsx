import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { Save } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyNewRequest } from '../../lib/requestActions';
import PageShell from '../../components/layout/PageShell';
import FormLabel, { HintText } from '../../components/ui/FormLabel';
import { TECHNICAL_REQUEST_STATUS } from '../../constants/technicalRequest';
import { TECH_LABELS, TECH_PLACEHOLDERS } from '../../lib/labels/technical';
import { filterActiveItems, findItemByName, sortItemsByName } from '../../lib/items';
import { getModuleById, MODULE_IDS } from '../../constants/modules';

const mod = getModuleById(MODULE_IDS.technical);

export default function TechnicalReplacementForm() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemType, setItemType] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [urgency, setUrgency] = useState('Low');
  const [justification, setJustification] = useState('');
  const [alternativeOption, setAlternativeOption] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'items'), where('category', '==', 'technical'));
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      const activeOnly = sortItemsByName(filterActiveItems(items));
      setAvailableItems(activeOnly);
      if (activeOnly.length > 0 && !itemType) {
        setItemType(activeOnly[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    if (!term) return availableItems;
    return availableItems.filter((i) => String(i.name || '').toLowerCase().includes(term));
  }, [availableItems, itemSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const itemNameForPayload = itemType === 'Other' ? customItem.trim() : itemType;
      if (!itemNameForPayload) {
        throw new Error('Please select or enter an item.');
      }
      if (!justification.trim()) {
        throw new Error('Justification for replacement is required.');
      }

      if (itemType === 'Other' && customItem.trim()) {
        const existing = findItemByName(availableItems, customItem);
        if (!existing) {
          await addDoc(collection(db, 'items'), {
            name: customItem.trim(),
            category: 'technical',
            isActive: true,
            replacementOnly: true,
            pendingAdminReview: true,
            createdByUserId: currentUser.id,
            createdByEmail: currentUser.email,
            createdAt: serverTimestamp(),
          });
        }
      }

      const resolvedItem = availableItems.find((i) => i.name === itemType);
      const userName = currentUser.name || currentUser.email?.split('@')[0];

      const requestData = {
        requestType: 'Replacement',
        itemType: itemNameForPayload,
        customItem: itemType === 'Other' ? customItem.trim() : '',
        finalItemName: itemNameForPayload,
        neededByDate: neededByDate || null,
        justification: justification.trim(),
        alternativeOption: alternativeOption.trim(),
        referenceUrl: referenceUrl.trim(),
        urgency,
        status: TECHNICAL_REQUEST_STATUS.Submitted,
        category: 'technical',
        moduleId: 'technical',
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        itemId: resolvedItem?.id || null,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, mod.collection), requestData);

      try {
        await notifyNewRequest({ id: docRef.id, ...requestData, userName }, mod);
      } catch (notifyErr) {
        console.error(notifyErr);
      }

      navigate('/technical');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit replacement request.');
    }
    setLoading(false);
  };

  return (
    <PageShell title="Replacement Request" backTo="/technical">
      <div className="glass-panel panel-padding" style={{ maxWidth: 640, margin: '0 auto' }}>
        <p className="section-kicker">Technical</p>
        <h2 style={{ margin: '0.25rem 0 1rem' }}>Replacement request</h2>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Replace an existing item that is damaged or not working — select from the list or add a custom name.
        </p>

        {error && (
          <div className="badge-danger" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <FormLabel label={TECH_LABELS.selectItem} required />
            <input
              type="search"
              className="form-control"
              style={{ marginBottom: '0.5rem' }}
              placeholder="Search item..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
            <select
              className="form-control"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              required
            >
              {filteredItems.length === 0 && <option value="">— No items —</option>}
              {filteredItems.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
              <option value="Other">{TECH_LABELS.itemNotListed.en}</option>
            </select>
          </div>

          {itemType === 'Other' && (
            <div
              className="form-group animate-fade-in"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '1rem',
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <FormLabel label={TECH_LABELS.describeItem} required />
              <HintText text={TECH_LABELS.otherItemHint} variant="info" />
              <input
                type="text"
                className="form-control"
                placeholder={TECH_PLACEHOLDERS.customItem.en}
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                required
              />
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Custom items added here appear only in the replacement list, not in new requirement catalog.
              </p>
            </div>
          )}

          <div className="form-group">
            <FormLabel label={TECH_LABELS.neededByDate} />
            <input
              type="date"
              className="form-control"
              value={neededByDate}
              onChange={(e) => setNeededByDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <FormLabel label={TECH_LABELS.urgencyLevel} />
            <select className="form-control" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>

          <div className="form-group">
            <FormLabel label={TECH_LABELS.justificationReplacement} required />
            <textarea
              className="form-control"
              rows={3}
              placeholder="Explain why this item needs replacement"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <FormLabel label={TECH_LABELS.alternativeOption} />
            <textarea
              className="form-control"
              rows={2}
              placeholder={TECH_PLACEHOLDERS.replacementOption.en}
              value={alternativeOption}
              onChange={(e) => setAlternativeOption(e.target.value)}
            />
          </div>

          <div className="form-group">
            <FormLabel label={TECH_LABELS.referenceUrl} />
            <input
              type="url"
              className="form-control"
              placeholder={TECH_PLACEHOLDERS.referenceUrl.en}
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            <Save size={18} /> {loading ? 'Submitting...' : 'Submit Replacement Request'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
