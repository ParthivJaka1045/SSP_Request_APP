import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { buildItemPayload } from '../../lib/itemMedia';

export default function UserAddItemPanel({ moduleId, itemsCategory, currentUser, onAdded }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    setSaving(true);
    setError('');
    try {
      const payload = buildItemPayload({
        name,
        description: form.description,
        imageUrl: form.imageUrl,
        imageLinksText: '',
        category: itemsCategory,
        extra: {
          isActive: true,
          createdByUserId: currentUser.id,
          createdByEmail: currentUser.email,
          createdAt: serverTimestamp(),
        },
      });
      const ref = await addDoc(collection(db, 'items'), payload);
      setForm({ name: '', description: '', imageUrl: '' });
      setOpen(false);
      onAdded?.({ id: ref.id, ...payload });
    } catch {
      setError('Could not add item. Try again.');
    }
    setSaving(false);
  };

  return (
    <div className="user-add-item">
      {!open ? (
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Add item to catalog
        </button>
      ) : (
        <div className="glass-panel panel-padding user-add-item__form">
          <div className="user-add-item__head">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Add new item</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
              <X size={14} />
            </button>
          </div>
          {error && <div className="badge-danger" style={{ padding: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid-2">

            <div className="form-group">
              <label className="form-label">Item name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Image URL (optional)</label>
              <input
                className="form-control"
                type="url"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
              <Plus size={16} /> {saving ? 'Adding...' : 'Add to catalog'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
