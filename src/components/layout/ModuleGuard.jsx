import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getModuleFromPath } from '../../constants/modules';
import { canAccessModule } from '../../lib/permissions';

export default function ModuleGuard() {
  const { currentUser, activeRole } = useAuth();
  const { pathname } = useLocation();
  const mod = getModuleFromPath(pathname);

  if (mod && !canAccessModule(currentUser, mod.id, activeRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
