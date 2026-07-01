/** SSP multi-role permissions (STK-inspired: active role + union of assigned roles). */

export const SSP_ROLES = Object.freeze({
  admin: 'admin',
  coordinator: 'coordinator',
  hod: 'hod',
  santo: 'santo',
  member: 'member',
});

export const ACTIVE_ROLE_STORAGE_KEY = 'ssp_active_role';

export const ROLE_OPTIONS = [
  { value: SSP_ROLES.member, label: 'Member', labelGu: 'સભ્ય' },
  { value: SSP_ROLES.hod, label: 'HOD', labelGu: 'HOD' },
  { value: SSP_ROLES.santo, label: 'P Santo', labelGu: 'પૂજ્ય સંતો' },
  { value: SSP_ROLES.coordinator, label: 'Central Triage Coordinator', labelGu: 'કોઓર્ડિનેટર' },
  { value: SSP_ROLES.admin, label: 'Admin', labelGu: 'એડમિન' },
];

export const MODULE_SCOPE_OPTIONS = [
  { value: 'technical', label: 'Technical', labelGu: 'ટેકનિકલ' },
  { value: 'general', label: 'General Store', labelGu: 'જનરલ સ્ટોર' },
  { value: 'subscription', label: 'Subscription', labelGu: 'સબ્સ્ક્રિપ્શન' },
  { value: 'travel', label: 'Going Home', labelGu: 'ઘરે જવાની' },
];

const ROLE_ORDER = ROLE_OPTIONS.map((r) => r.value);

export function getRoleLabel(role) {
  const found = ROLE_OPTIONS.find((r) => r.value === role);
  return found ? found.label : role;
}

export function normalizeRoles(roles) {
  const unique = Array.from(new Set((roles || []).filter(Boolean)));
  const sorted = ROLE_ORDER.filter((r) => unique.includes(r));
  return sorted.length ? sorted : [SSP_ROLES.member];
}

export function getRolesFromUser(user) {
  if (!user) return [];
  if (user.roles?.length) return normalizeRoles(user.roles);
  if (user.role) return normalizeRoles([user.role]);
  return [SSP_ROLES.member];
}

/** All roles the account has (union). */
export function userHasRole(userOrRoles, role) {
  const roles = Array.isArray(userOrRoles)
    ? normalizeRoles(userOrRoles)
    : getRolesFromUser(userOrRoles);
  return roles.includes(role);
}

export function userHasAnyRole(user, rolesList) {
  return rolesList.some((r) => userHasRole(user, r));
}

export function getPrimaryRole(user) {
  if (user?.primaryRole && userHasRole(user, user.primaryRole)) {
    return user.primaryRole;
  }
  const roles = getRolesFromUser(user);
  if (roles.includes(SSP_ROLES.admin)) return SSP_ROLES.admin;
  if (roles.includes(SSP_ROLES.coordinator)) return SSP_ROLES.coordinator;
  if (roles.includes(SSP_ROLES.hod)) return SSP_ROLES.hod;
  if (roles.includes(SSP_ROLES.santo)) return SSP_ROLES.santo;
  return roles[0] || SSP_ROLES.member;
}

export function resolveActiveRole(user, activeRoleOverride) {
  const allRoles = getRolesFromUser(user);
  const candidate = activeRoleOverride || user?.activeRole || getPrimaryRole(user);
  return allRoles.includes(candidate) ? candidate : getPrimaryRole(user);
}

/** Build workspace context for UI + data scoping. */
export function getUserWorkspace(user, activeRoleOverride) {
  const allRoles = getRolesFromUser(user);
  const activeRole = resolveActiveRole(user, activeRoleOverride);
  return {
    allRoles,
    activeRole,
    isAdmin: activeRole === SSP_ROLES.admin,
    isCoordinator: activeRole === SSP_ROLES.coordinator,
    isHod: activeRole === SSP_ROLES.hod,
    isSanto: activeRole === SSP_ROLES.santo,
    isMember: activeRole === SSP_ROLES.member,
    canSwitchRole: allRoles.length > 1,
  };
}

export function isActiveUser(user) {
  return Boolean(user && user.isActive !== false);
}

export function hodCanAccessModule(user, moduleId, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.hod && MODULE_SCOPE_OPTIONS.some((m) => m.value === moduleId);
}


/** Module access for current active role. */
export function canAccessModule(user, moduleId, activeRole) {
  if (!user) return false;
  const role = resolveActiveRole(user, activeRole);
  if (role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.coordinator) return true;
  if (role === SSP_ROLES.member) return true;
  return false;
}

/** Admin and HOD share the same management access, but HOD no longer manages users or items. */
export function isStaffManager(user, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.admin || role === SSP_ROLES.hod;
}

export function canManageUsers(user, activeRole) {
  return resolveActiveRole(user, activeRole) === SSP_ROLES.admin;
}

export function canManageItems(user, activeRole) {
  return resolveActiveRole(user, activeRole) === SSP_ROLES.admin;
}

export function canViewAdminPanel(user, activeRole) {
  return isStaffManager(user, activeRole);
}

export function canAccessReports(user, activeRole) {
  if (!user) return false;
  const role = resolveActiveRole(user, activeRole);
  return role !== SSP_ROLES.coordinator; // Allow everyone except coordinator
}

/** Who can change status / assign (by active role). */
export function canManageRequestStatus(user, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo || role === SSP_ROLES.coordinator;
}

/** Coordinator may only mark Seen or Reject. */
export function canCoordinatorTriage(user, activeRole) {
  return resolveActiveRole(user, activeRole) === SSP_ROLES.coordinator;
}

export function canRejectRequest(user, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo || role === SSP_ROLES.coordinator;
}

export function canMarkRequestSeen(user, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo || role === SSP_ROLES.coordinator;
}

/** Full status workflow (approve, in progress, complete) — not for coordinator-only triage. */
export function canAdvanceRequestStatus(user, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo;
}

/** Who uses the manager orders workspace. */
export function canUseManagerOrdersWorkspace(user, activeRole) {
  return canManageRequestStatus(user, activeRole);
}

/** Triage staff (admin, HOD, coordinator) can forward orders to HOD or Santo — not Santo role itself. */
export function canAssignRequest(user, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.coordinator;
}

export function canCreateRequest(user, moduleId, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  if (role === SSP_ROLES.admin || role === SSP_ROLES.member) {
    return canAccessModule(user, moduleId, role);
  }
  return false;
}

export function canAddToRequestCart(user, moduleId, activeRole) {
  if (moduleId === 'travel') return false;
  return canCreateRequest(user, moduleId, activeRole);
}

/** View single request — active role determines scope. */
export function canViewRequest(user, request, activeRole) {
  if (!user || !request) return false;
  const role = resolveActiveRole(user, activeRole);

  if (role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo || role === SSP_ROLES.coordinator) return true;

  if (role === SSP_ROLES.member) {
    return request.userId === user.id;
  }

  return false;
}

export function canEditRequestAsUser(user, request, activeRole) {
  if (!canViewRequest(user, request, activeRole)) return false;
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.member && request.userId === user.id;
}

export function canEditRequestAsStaff(user, request, activeRole) {
  if (!request) return false;
  const role = resolveActiveRole(user, activeRole);
  return (
    (role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo || role === SSP_ROLES.coordinator) &&
    canManageRequestStatus(user, activeRole)
  );
}

/**
 * Firestore query strategy per active role.
 * Returns: 'all' | 'own' | 'assigned' | 'none'
 */
export function getRequestFetchMode(user, moduleId, activeRole) {
  const role = resolveActiveRole(user, activeRole);

  if (role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo || role === SSP_ROLES.coordinator) return 'all';
  if (role === SSP_ROLES.member) return 'own';
  return 'none';
}

export function filterRequestsForReport(requests, user, activeRole) {
  const role = resolveActiveRole(user, activeRole);

  if (role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo) return requests;

  return requests.filter((r) => r.userId === user.id);
}

export function getRoleDashboardHint(activeRole) {
  const hints = {
    admin: 'Active role: Admin — full system, all modules, users, items, and reports.',
    hod: 'Active role: HOD — full system access: orders, masters, users, and reports.',
    santo: 'Active role: P Santo — full view access, with assigned work highlighted separately.',
    coordinator: 'Active role: Central Triage Coordinator — validate, route, mark seen, and reject requests.',
    member: 'Active role: Member — browse items, submit requests, and use Request Cart.',
  };
  return hints[activeRole] || hints.member;
}

/** Legacy aliases */
export function canManageTechnicalRequestStatus(user, activeRole) {
  return canManageRequestStatus(user, activeRole);
}

export function canAssignTechnicalRequest(user, activeRole) {
  return canAssignRequest(user, activeRole);
}

export function canViewAllTechnicalRequests(user, activeRole) {
  const role = resolveActiveRole(user, activeRole);
  return role === SSP_ROLES.admin || role === SSP_ROLES.hod || role === SSP_ROLES.santo || role === SSP_ROLES.coordinator;
}

export function isDirectFormModule(moduleId) {
  return moduleId === 'travel';
}

export function canCreateTechnicalRequest(user, activeRole) {
  return canCreateRequest(user, 'technical', activeRole);
}

export function canViewTechnicalRequest(user, request, activeRole) {
  return canViewRequest(user, request, activeRole);
}
