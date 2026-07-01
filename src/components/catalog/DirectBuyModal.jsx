import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyNewRequest } from '../../lib/requestActions';
import { TECHNICAL_REQUEST_STATUS } from '../../constants/technicalRequest';
import Modal from '../ui/Modal';
import FormLabel from '../ui/FormLabel';
import { Save } from 'lucide-react';

export default function DirectBuyModal({ open, onClose, item, mod }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [urgency, setUrgency] = useState('Low');

  const [customItem, setCustomItem] = useState('');
  const [justification, setJustification] = useState('');
  const [comments, setComments] = useState('');

  const [quantity, setQuantity] = useState('1');
  const [alternative, setAlternative] = useState('No');

  const [durationFrom, setDurationFrom] = useState('');
  const [durationTo, setDurationTo] = useState('');
  const [cost, setCost] = useState('');

  const isTechnical = mod?.id === 'technical';
  const isGeneral = mod?.id === 'general';
  const isSubscription = mod?.id === 'subscription';

  const resetForm = () => {
    setUrgency('Low');
    setCustomItem('');
    setJustification('');
    setComments('');
    setQuantity('1');
    setAlternative('No');
    setDurationFrom('');
    setDurationTo('');
    setCost('');
  };

  const handleClose = (success) => {
    resetForm();
    onClose(success);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemName = item?.name === 'Other' ? customItem.trim() : (item?.name || customItem.trim() || 'Custom Item');
      const userName = currentUser.name || currentUser.email?.split('@')[0];

      let requestData = {
        requestType: 'New Requirement',
        itemType: itemName,
        finalItemName: itemName,
        urgency,
        status: TECHNICAL_REQUEST_STATUS.Submitted,
        category: mod.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        createdAt: serverTimestamp(),
      };

      if (isTechnical) {
        requestData = {
          ...requestData,
          customItem: customItem.trim(),
          justification: justification.trim(),
          comments: comments.trim(),
        };
      } else if (isSubscription) {
        requestData = {
          ...requestData,
          durationFrom: durationFrom.trim(),
          durationTo: durationTo.trim(),
          cost: cost.trim(),
          justification: justification.trim(),
        };
      } else if (isGeneral) {
        requestData = {
          ...requestData,
          quantity: quantity.trim(),
          alternative,
          comments: comments.trim(),
        };
      }

      if (item?.id) {
        requestData.itemId = item.id;
      }

      const docRef = await addDoc(collection(db, mod.collection), requestData);

      try {
        await notifyNewRequest({ id: docRef.id, ...requestData, category: mod.id, userName }, mod);
      } catch (err) {
        console.error('Notify error', err);
      }

      handleClose(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit direct buy request.');
    }
    setLoading(false);
  };

  if (!mod || !item) return null;

  return (
    <Modal open={open} onClose={() => handleClose(false)} title={`Direct Buy: ${item.name}`} hideFooter>
      <form onSubmit={handleSubmit} className="form-grid-1" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {isTechnical && (
          <>
            {item.name === 'Other' && (
              <div className="form-group">
                <FormLabel label={{ en: 'Item Name *' }} required />
                <input type="text" className="form-control" value={customItem} onChange={(e) => setCustomItem(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <FormLabel label={{ en: 'Justification *' }} required />
              <textarea className="form-control" rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} required />
            </div>
            <div className="form-group">
              <FormLabel label={{ en: 'Specs / Additional Comments' }} />
              <textarea className="form-control" rows={2} value={comments} onChange={(e) => setComments(e.target.value)} />
            </div>
          </>
        )}

        {isGeneral && (
          <>
            <div className="form-group">
              <FormLabel label={{ en: 'Quantity *' }} required />
              <input type="number" min="1" className="form-control" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="form-group">
              <FormLabel label={{ en: 'Alternative acceptable *' }} required />
              <select className="form-control" value={alternative} onChange={(e) => setAlternative(e.target.value)} required>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="form-group">
              <FormLabel label={{ en: 'Additional comments' }} />
              <textarea className="form-control" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
            </div>
          </>
        )}

        {isSubscription && (
          <>
            <div className="form-grid-2">
              <div className="form-group">
                <FormLabel label={{ en: 'Required duration — from *' }} required />
                <input type="date" className="form-control" value={durationFrom} onChange={(e) => setDurationFrom(e.target.value)} required />
              </div>
              <div className="form-group">
                <FormLabel label={{ en: 'Required duration — to *' }} required />
                <input type="date" className="form-control" value={durationTo} onChange={(e) => setDurationTo(e.target.value)} required min={durationFrom || undefined} />
              </div>
            </div>
            <div className="form-group">
              <FormLabel label={{ en: 'Cost *' }} required />
              <input type="text" className="form-control" placeholder="e.g. ₹999" value={cost} onChange={(e) => setCost(e.target.value)} required />
            </div>
            <div className="form-group">
              <FormLabel label={{ en: 'Justification *' }} required />
              <textarea className="form-control" rows={4} value={justification} onChange={(e) => setJustification(e.target.value)} required />
            </div>
          </>
        )}

        <div className="form-group">
          <FormLabel label={{ en: 'Urgency level' }} />
          <select className="form-control" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            <option value="Low">🟢 Low</option>
            <option value="Medium">🟡 Medium</option>
            <option value="High">🔴 High</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
          <Save size={18} /> {loading ? 'Submitting...' : 'Direct Buy'}
        </button>
      </form>
    </Modal>
  );
}
