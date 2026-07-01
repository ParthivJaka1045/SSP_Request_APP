import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { getPrimaryImageEntry } from '../lib/itemMedia';
import { getItemImageCropStyle } from '../lib/itemImageCrop';
import { MODULES, getModuleById } from '../constants/modules';
import { sortItemsByName, findItemByName, normalizeItemName, findDuplicateItemIds } from '../lib/items';
import { buildItemPayload, emptyItemImageForm, itemToImageForm } from '../lib/itemMedia';
import ItemImageFields from '../components/catalog/ItemImageFields';
import { userHasRole, SSP_ROLES } from '../lib/permissions';
import { subscribeModuleSettings, updateModuleSetting } from '../lib/moduleSettings';

const PAGE_SIZE = 24;
const MODULE_CHIPS = MODULES.filter(m => m.id !== 'travel').map((m) => ({ id: m.id, label: m.shortTitle }));

export default function Masters() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('module') || MODULES[0].id;
  const mod = getModuleById(category);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemSearch, setItemSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [addError, setAddError] = useState('');
  const [moduleSettings, setModuleSettings] = useState(null);
  const [deduping, setDeduping] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    ...emptyItemImageForm(),
  });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: category,
    ...emptyItemImageForm(),
  });

  if (!userHasRole(currentUser, SSP_ROLES.admin) && !userHasRole(currentUser)) {
    return (
      <PageShell title="Access Denied" backTo="/">
        <p>Admin only.</p>
      </PageShell>
    );
  }

  const resetForm = () => setForm({ name: '', description: '', ...emptyItemImageForm() });

  useEffect(() => subscribeModuleSettings(setModuleSettings), []);

  useEffect(() => {
    fetchItems();
    setVisibleCount(PAGE_SIZE);
    setItemSearch('');
    setEditingId(null);
    resetForm();
  }, [category]);

  const allowUserAdd = Boolean(moduleSettings?.allowUserItemAdd?.[category]);

  const setModule = (moduleId) => {
    const next = new URLSearchParams(searchParams);
    if (moduleId) next.set('module', moduleId);
    else next.delete('module');
    setSearchParams(next);
  };

  const handleToggleUserAdd = async () => {
    const next = { ...(moduleSettings?.allowUserItemAdd || {}), [category]: !allowUserAdd };
    await updateModuleSetting('allowUserItemAdd', next);
  };

  const handleDedupe = async () => {
    const ids = findDuplicateItemIds(items);
    if (!ids.length) return alert('No duplicates found.');
    if (!window.confirm(`Delete ${ids.length} duplicate(s)?`)) return;
    setDeduping(true);
    try {
      for (const id of ids) await deleteDoc(doc(db, 'items', id));
      setItems(items.filter((i) => !ids.includes(i.id)));
    } catch (e) {
      console.error(e);
    }
    setDeduping(false);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'items'), where('category', '==', category));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setItems(sortItemsByName(list));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    let list = items;
    const term = itemSearch.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (i) =>
        String(i.name || '').toLowerCase().includes(term) ||
        String(i.description || '').toLowerCase().includes(term),
    );
  }, [items, itemSearch]);

  const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);

  const duplicateNameCount = useMemo(() => {
    const counts = {};
    for (const i of items) counts[normalizeItemName(i.name)] = (counts[normalizeItemName(i.name)] || 0) + 1;
    return Object.values(counts).filter((c) => c > 1).length;
  }, [items]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    if (findItemByName(items, name)) {
      setAddError(`"${name}" already exists.`);
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const payload = buildItemPayload({
        ...form,
        category,
        extra: { isActive: true },
      });
      const docRef = await addDoc(collection(db, 'items'), payload);
      setItems(sortItemsByName([...items, { id: docRef.id, ...payload }]));
      resetForm();
    } catch {
      setAddError('Failed to add item.');
    }
    setAdding(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name || '',
      description: item.description || '',
      ...itemToImageForm(item),
    });
  };

  const handleUpdateItem = async (id) => {
    const name = editForm.name.trim();
    if (!name) return;
    const payload = buildItemPayload({ ...editForm, category });
    await updateDoc(doc(db, 'items', id), payload);
    setItems(sortItemsByName(items.map((i) => (i.id === id ? { ...i, ...payload } : i))));
    setEditingId(null);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete permanently?')) return;
    await deleteDoc(doc(db, 'items', id));
    setItems(items.filter((i) => i.id !== id));
  };

  const toggleActiveStatus = async (item) => {
    const newStatus = item.isActive === false;
    await updateDoc(doc(db, 'items', item.id), { isActive: newStatus });
    setItems(items.map((i) => (i.id === item.id ? { ...i, isActive: newStatus } : i)));
  };

  return (
    <PageShell title="Masters" backTo="/">
      <div className="masters-module-bar glass-panel panel-padding">
        <div>
          <p className="section-kicker">Masters</p>
          <h3 style={{ margin: '0.25rem 0 0' }}>Items & settings</h3>
        </div>
        <div className="masters-tabs">
          {MODULE_CHIPS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`filter-chip ${category === m.id ? 'filter-chip--active' : ''}`}
              onClick={() => setModule(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel panel-padding admin-settings-row" style={{ margin: '1rem 0' }}>
        <div className="admin-settings-row__toggle">
          <div>
            <strong>{mod.shortTitle} — allow users to add items</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Toggle for all users in this module.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleToggleUserAdd}>
            {allowUserAdd ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {allowUserAdd ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="masters-stk-grid">
        <div className="glass-panel panel-padding masters-stk-panel">
          <p className="section-kicker">Item master</p>
          <h3 style={{ margin: '0.25rem 0 1rem' }}>Create item — {mod.shortTitle}</h3>
          {addError && <div className="badge-danger" style={{ padding: '0.6rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{addError}</div>}
          <form onSubmit={handleAddItem}>
            <div className="form-group">
              <label className="form-label">Item name *</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Item description (optional)" />
            </div>
            <ItemImageFields value={form} onChange={(next) => setForm({ ...form, ...next })} />
            <button type="submit" disabled={adding} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Plus size={18} /> {adding ? 'Adding...' : 'Create item'}
            </button>
          </form>
        </div>

        <div className="glass-panel masters-stk-panel masters-stk-list">
          <div className="masters-stk-list__head panel-padding">
            <div>
              <p className="section-kicker">Item master</p>
              <h3 style={{ margin: '0.25rem 0 0' }}>Item list</h3>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Active + inactive items. Preview: <Link to={mod.basePath}>{mod.shortTitle}</Link>
              </p>
            </div>
            <div className="masters-stk-list__tools">
              {duplicateNameCount > 0 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleDedupe} disabled={deduping}>
                  Remove duplicates
                </button>
              )}
              <div className="catalog-search" style={{ minWidth: 200 }}>
                <Search size={16} />
                <input className="form-control" placeholder="Search items..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
              </div>
            </div>
          </div>

          {editingId && (
            <div className="panel-padding" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--primary-soft)' }}>
              <h4 style={{ margin: '0 0 0.75rem' }}>Edit item</h4>
              <div className="admin-item-form-grid">
                <input className="form-control" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <ItemImageFields value={editForm} onChange={(next) => setEditForm({ ...editForm, ...next })} />
                <textarea className="form-control" style={{ gridColumn: '1 / -1' }} rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateItem(editingId)}>Save</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="catalog-loading">Loading...</div>
          ) : (
            <div className="table-responsive">
              <table className="reports-table stk-table masters-item-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Item</th>
                    <th>Module</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.length === 0 ? (
                    <tr><td colSpan={5} className="reports-empty">No items in this module.</td></tr>
                  ) : (
                    visibleItems.map((item) => {
                      const img = getPrimaryImageEntry(item);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="masters-item-thumb">
                              {img?.url ? (
                                <img src={img.url} alt="" style={getItemImageCropStyle(img.crop)} />
                              ) : (
                                <span>—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{item.name}</strong>
                            {item.description && (
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.description}</p>
                            )}
                          </td>
                          <td>{getModuleById(item.category)?.shortTitle || mod.shortTitle}</td>
                          <td>
                            {item.isActive === false ? (
                              <span className="badge badge-danger" style={{ textTransform: 'none' }}>Inactive</span>
                            ) : (
                              <span className="badge badge-success" style={{ textTransform: 'none' }}>Active</span>
                            )}
                          </td>
                          <td>
                            <div className="masters-item-actions">
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleActiveStatus(item)} title="Toggle active">
                                {item.isActive === false ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                              </button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(item)} title="Edit">
                                <Edit2 size={14} />
                              </button>
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(item.id)} title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          {visibleCount < filteredItems.length && (
            <div className="panel-padding">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Load more ({filteredItems.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
