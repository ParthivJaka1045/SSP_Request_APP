import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Save } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyNewRequest } from '../../lib/requestActions';
import PageShell from '../../components/layout/PageShell';
import { getModuleById, MODULE_IDS } from '../../constants/modules';
import { TECHNICAL_REQUEST_STATUS } from '../../constants/technicalRequest';

const mod = getModuleById(MODULE_IDS.travel);

export default function TravelRequestForm() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState('Low');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!departureDate || !returnDate || !justification.trim()) return;
    setLoading(true);
    try {
      const userName = currentUser.name || currentUser.email?.split('@')[0];
      const requestData = {
        requestType: 'Going Home',
        itemType: 'Going Home Request',
        finalItemName: 'Going Home Request',
        departureDate,
        returnDate,
        justification: justification.trim(),
        urgency,
        status: TECHNICAL_REQUEST_STATUS.Submitted,
        category: mod.id,
        moduleId: mod.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, mod.collection), requestData);

      try {
        await notifyNewRequest({ id: docRef.id, ...requestData }, mod);
      } catch (e) {
        console.error(e);
      }
      navigate('/orders');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request.');
    }
    setLoading(false);
  };

  return (
    <PageShell title="Going Home Request" backTo="/">
      <div className="glass-panel panel-padding" style={{ maxWidth: 640, margin: '0 auto' }}>
        <p className="section-kicker">Going Home</p>
        <h2 style={{ margin: '0.25rem 0 1rem' }}>Travel request form</h2>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Submit your home travel request directly — no item catalog needed.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Departure date *</label>
            <input
              type="date"
              className="form-control"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Return date *</label>
            <input
              type="date"
              className="form-control"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
              min={departureDate || undefined}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Justification / Reason *</label>
            <textarea
              className="form-control"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why you need to travel home"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Urgency level</label>
            <select className="form-control" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            <Save size={18} /> {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
