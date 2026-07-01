import React, { useMemo } from 'react';
import { UserCheck, Users } from 'lucide-react';

function userRoles(u) {
  return u.roles || (u.role ? [u.role] : ['member']);
}

function isHodUser(u) {
  return userRoles(u).includes('hod');
}

function isSantoUser(u) {
  return userRoles(u).includes('santo');
}

export default function AssignmentPicker({ users, selectedIds, onChange, disabled }) {
  const hodUsers = useMemo(() => users.filter(isHodUser), [users]);
  const santoUsers = useMemo(() => users.filter(isSantoUser), [users]);

  const selectedHodCount = selectedIds.filter((id) => hodUsers.some((u) => u.id === id)).length;
  const selectedSantoCount = selectedIds.filter((id) => santoUsers.some((u) => u.id === id)).length;
  const activeGroup = selectedSantoCount > 0 ? 'santo' : selectedHodCount > 0 ? 'hod' : null;

  const toggleUser = (user, checked) => {
    const hodIds = new Set(hodUsers.map((u) => u.id));
    const santoIds = new Set(santoUsers.map((u) => u.id));

    if (checked) {
      if (isHodUser(user)) {
        onChange([...selectedIds.filter((id) => !santoIds.has(id)), user.id]);
      } else if (isSantoUser(user)) {
        onChange([...selectedIds.filter((id) => !hodIds.has(id)), user.id]);
      }
    } else {
      onChange(selectedIds.filter((id) => id !== user.id));
    }
  };

  const renderGroup = (groupKey, label, labelGu, icon, groupUsers, accentClass) => {
    const Icon = icon;
    const isBlocked = activeGroup && activeGroup !== groupKey;

    return (
      <div className={`assign-picker__group ${isBlocked ? 'assign-picker__group--blocked' : ''} ${activeGroup === groupKey ? 'assign-picker__group--active' : ''}`}>
        <div className={`assign-picker__group-head ${accentClass}`}>
          <Icon size={16} />
          <div>
            <strong>{label}</strong>
            <span>{labelGu}</span>
          </div>
          {activeGroup === groupKey && selectedIds.length > 0 && (
            <span className="assign-picker__count">{selectedIds.filter((id) => groupUsers.some((u) => u.id === id)).length} selected</span>
          )}
        </div>

        {isBlocked && (
          <p className="assign-picker__hint">
            {groupKey === 'hod'
              ? 'Santo પસંદ થયેલ છે — HOD assign કરવા પહેલા Santo clear કરો.'
              : 'HOD પસંદ થયેલ છે — Santo assign કરવા પહેલા HOD clear કરો.'}
          </p>
        )}

        <div className="assign-picker__list">
          {groupUsers.length === 0 ? (
            <p className="assign-picker__empty">No {label} users available.</p>
          ) : (
            groupUsers.map((u) => {
              const checked = selectedIds.includes(u.id);
              const itemDisabled = disabled || (isBlocked && !checked);

              return (
                <label
                  key={u.id}
                  className={`assign-picker__item ${checked ? 'assign-picker__item--checked' : ''} ${itemDisabled ? 'assign-picker__item--disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={itemDisabled}
                    onChange={(e) => toggleUser(u, e.target.checked)}
                  />
                  <span className="assign-picker__item-text">
                    {u.santoTag ? `${u.santoTag} — ` : ''}{u.name || u.email}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (users.length === 0) {
    return <p className="assign-picker__empty">No HOD or Santo users found.</p>;
  }

  return (
    <div className="assign-picker">
      <p className="assign-picker__rule">
        <strong>HOD</strong> અથવા <strong>Santo</strong> માં assign કરો — એક જ group માં multiple select થઈ શકે, બંને સાથે નહીં.
      </p>
      {renderGroup('hod', 'HOD', 'વિભાગ પ્રમુખ', UserCheck, hodUsers, 'assign-picker__group-head--hod')}
      {renderGroup('santo', 'P Santo', 'પૂજ્ય સંતો', Users, santoUsers, 'assign-picker__group-head--santo')}
    </div>
  );
}
