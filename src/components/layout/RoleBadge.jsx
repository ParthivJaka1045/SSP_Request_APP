import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleLabel, getRolesFromUser } from '../../lib/permissions';

const ROLE_CLASS_MAP = {
  admin: 'role-badge--admin',
  hod: 'role-badge--hod',
  santo: 'role-badge--santo',
  member: 'role-badge--member',
};

export default function RoleBadge({ compact, showAllRoles }) {
  const { currentUser, activeRole, workspace } = useAuth();
  if (!currentUser) return null;

  const roles = getRolesFromUser(currentUser);

  if (showAllRoles && roles.length > 1) {
    return (
      <div className="role-badge-group" style={{ marginTop: '0.5rem' }}>
        {roles.map((r) => (
          <span
            key={r}
            className={`role-badge ${ROLE_CLASS_MAP[r] || ''} ${r === activeRole ? 'role-badge--active' : ''}`}
          >
            {getRoleLabel(r)}
            {r === activeRole ? ' · active' : ''}
          </span>
        ))}
      </div>
    );
  }

  const primary = activeRole || workspace?.activeRole;
  return (
    <span
      className={`role-badge ${ROLE_CLASS_MAP[primary] || ''} role-badge--active`}
    >
      {getRoleLabel(primary)}
    </span>
  );
}

