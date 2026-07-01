import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_OPTIONS, getRoleLabel } from '../../lib/permissions';

const ROLE_COLORS = {
  admin: '#dc2626',
  hod: '#0891b2',
  santo: '#7c3aed',
  member: '#d97706',
};

export default function RoleSwitcher({ compact }) {
  const { workspace, setActiveRole, activeRole } = useAuth();

  if (!workspace?.canSwitchRole) return null;

  return (
    <div className={`role-switcher ${compact ? 'role-switcher--compact' : ''}`}>
      {!compact && (
        <span className="role-switcher__label">Switch role</span>
      )}
      <div className={`role-switcher__pills ${compact ? '' : 'role-switcher__pills--grid'}`}>
        {workspace.allRoles.map((role) => (
          <button
            key={role}
            type="button"
            className={`role-switcher__pill ${activeRole === role ? 'is-active' : ''}`}
            style={{
              '--role-color': ROLE_COLORS[role] || '#64748b',
            }}
            onClick={() => setActiveRole(role)}
          >
            {getRoleLabel(role)}
          </button>
        ))}
      </div>
    </div>
  );
}
