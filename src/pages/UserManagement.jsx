import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { UserPlus, Search, Edit2, Trash2 } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import SearchableMultiSelect from '../components/ui/SearchableMultiSelect';
import {
  assertEmailAvailable,
  normalizeEmail,
} from '../lib/userEmail';
import {
  ROLE_OPTIONS,
  normalizeRoles,
  getRolesFromUser,
  getRoleLabel,
  canManageUsers,
  userHasRole,
  SSP_ROLES,
} from '../lib/permissions';

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  roles: ['member'],
  primaryRole: 'member',
  santoTag: '',
  isActive: true,
});

function roleBadgeStyle(role) {
  if (role === 'admin') return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
  if (role === 'santo') return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
  if (role === 'hod') return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
  return { background: 'rgba(255,255,255,0.1)', color: 'inherit' };
}

export default function UserManagement() {
  const { currentUser, activeRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canAccess = userHasRole(currentUser, SSP_ROLES.admin);
  const canDelete = canManageUsers(currentUser, activeRole);

  useEffect(() => {
    if (canAccess) fetchUsers();
  }, [canAccess]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email)));
      setUsers(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const roles = getRolesFromUser(u).join(' ');
      const hay = `${u.name} ${u.email} ${roles} ${u.santoTag || ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [users, search]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
  };

  const startEdit = (user) => {
    const roles = getRolesFromUser(user);
    setEditingId(user.id);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      roles,
      primaryRole: user.primaryRole || user.role || roles[0] || 'member',
      santoTag: user.santoTag || '',
      isActive: user.isActive !== false,
    });
    setError('');
  };

  const roleSelectOptions = ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const roles = normalizeRoles(form.roles);
      const primaryRole = form.primaryRole || roles[0] || 'member';
      const normalizedEmail = normalizeEmail(form.email);

      if (!form.name.trim() || !normalizedEmail) {
        throw new Error('Name and email are required.');
      }

      if (roles.includes('santo') && !form.santoTag.trim()) {
        throw new Error('Santo users should have a Santo tag (e.g. Pujya Gunadh Swami).');
      }

      if (!form.roles.includes('santo')) {
        form.santoTag = null;
      }

      await assertEmailAvailable(normalizedEmail, { users, excludeId: editingId });

      const payload = {
        name: form.name.trim(),
        email: normalizedEmail,
        roles,
        role: primaryRole,
        primaryRole,
        santoTag: roles.includes('santo') ? form.santoTag.trim() : null,
        hodModules: [],
        defaultHodModule: null,
        isActive: form.isActive,
      };

      if (editingId) {
        payload.updatedAt = serverTimestamp();
        if (form.password.trim()) {
          payload.password = form.password.trim();
        }
        await updateDoc(doc(db, 'users', editingId), payload);
        setUsers(users.map((u) => (u.id === editingId ? { ...u, ...payload } : u)));
      } else {
        if (!form.password.trim()) throw new Error('Password is required for new users.');

        const docRef = await addDoc(collection(db, 'users'), {
          ...payload,
          password: form.password.trim(),
          createdAt: serverTimestamp(),
        });
        setUsers([...users, { id: docRef.id, ...payload, password: form.password.trim() }]);
      }

      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save user.');
    }
    setSaving(false);
  };

  const toggleActive = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const activating = user.isActive === false;
    const label = activating ? 'activate' : 'deactivate';
    if (!window.confirm(`${activating ? 'Activate' : 'Deactivate'} ${user.name || user.email}?`)) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { isActive: activating });
      setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: activating } : u)));
    } catch (e) {
      console.error(e);
      alert(`Could not ${label} user.`);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Permanently delete ${user.name || user.email} from Firebase? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'users', user.id));
      setUsers(users.filter((u) => u.id !== user.id));
      if (editingId === user.id) resetForm();
    } catch (e) {
      console.error(e);
      alert('Error deleting user.');
    }
  };

  if (!canAccess) {
    return (
      <PageShell title="Access Denied" backTo="/">
        <p>Admin only.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Users Manage" backTo="/">
      <div className="detail-grid user-manage-grid">
        <div className="glass-panel panel-padding">
          <p className="section-kicker">User management</p>
          <h3 style={{ margin: '0.25rem 0 1rem' }}>
            {editingId ? 'Edit account' : 'Create account'}
          </h3>

          {error && (
            <div className="badge-danger" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={Boolean(editingId)}
              />
              {editingId && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                  Email cannot be changed after creation.
                </p>
              )}
              {!editingId && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                  Each email can only be used for one account.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                {editingId ? 'New Password (optional)' : 'Password *'}
              </label>
              <input
                type="password"
                className="form-control"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
                placeholder={editingId ? 'Leave blank to keep current' : ''}
              />
            </div>

            <SearchableMultiSelect
              label="Roles"
              options={roleSelectOptions}
              selected={form.roles}
              onChange={(roles) => {
                const normalized = normalizeRoles(roles);
                setForm((prev) => ({
                  ...prev,
                  roles: normalized,
                  primaryRole: normalized.includes(prev.primaryRole) ? prev.primaryRole : normalized[0],
                }));
              }}
            />

            {form.roles.length > 1 && (
              <div className="form-group">
                <label className="form-label">Primary Role</label>
                <select
                  className="form-control"
                  value={form.primaryRole}
                  onChange={(e) => setForm({ ...form, primaryRole: e.target.value })}
                >
                  {form.roles.map((r) => (
                    <option key={r} value={r}>{getRoleLabel(r)}</option>
                  ))}
                </select>
              </div>
            )}

            {form.roles.includes('santo') && (
              <div className="form-group">
                <label className="form-label">Santo Tag / Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Pujya Gunadh Swami"
                  value={form.santoTag}
                  onChange={(e) => setForm({ ...form, santoTag: e.target.value })}
                  required
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Requests can be assigned to this Santo user by name.
                </p>
              </div>
            )}

            {editingId && (
              <label className="radio-option" style={{ marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <UserPlus size={16} /> {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="glass-panel user-manage-list">
          <div className="panel-padding user-manage-list__head">
            <div>
              <p className="section-kicker">User management</p>
              <h3 style={{ margin: '0.25rem 0 0' }}>User list</h3>
            </div>
            <div style={{ position: 'relative', minWidth: '200px', flex: '1', maxWidth: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Email</th>
                    <th style={{ padding: '1rem' }}>Roles</th>
                    <th style={{ padding: '1rem' }}>Scope</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const roles = getRolesFromUser(user);
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: user.isActive === false ? 0.55 : 1 }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{user.name || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--accent-info)' }}>{user.email}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {roles.map((r) => (
                              <span key={r} className="badge" style={{ ...roleBadgeStyle(r), textTransform: 'capitalize', fontSize: '0.7rem' }}>
                                {r}
                              </span>
                            ))}
                          </div>
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Primary: {user.primaryRole || user.role || 'member'}
                          </p>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {user.santoTag && <div>Santo: {user.santoTag}</div>}
                          {!user.santoTag && '—'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {user.isActive === false ? (
                            <span className="badge badge-danger" style={{ textTransform: 'none' }}>Inactive</span>
                          ) : (
                            <span className="badge badge-success" style={{ textTransform: 'none' }}>Active</span>
                          )}
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {user.isActive === false ? 'Login blocked' : 'Can sign in'}
                          </p>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => startEdit(user)} className="btn btn-secondary" style={{ padding: '0.35rem' }} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(user)}
                              className={`btn btn-sm ${user.isActive === false ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              title={user.isActive === false ? 'Activate user' : 'Deactivate user'}
                              disabled={user.id === currentUser?.id}
                            >
                              {user.isActive === false ? 'Activate' : 'Deactivate'}
                            </button>
                            {canDelete && (
                              <button type="button" onClick={() => handleDelete(user)} className="btn btn-danger" style={{ padding: '0.35rem' }} title="Delete permanently" disabled={user.id === currentUser?.id}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
