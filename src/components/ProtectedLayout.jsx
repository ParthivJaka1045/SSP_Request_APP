import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userHasAnyRole, SSP_ROLES } from '../lib/permissions';
import AppLayout from './layout/AppLayout';

export default function ProtectedLayout({ requiredRole }) {
  const { currentUser, activeRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (
    requiredRole === 'admin'
    && !userHasAnyRole(currentUser, [SSP_ROLES.admin, SSP_ROLES.hod])
  ) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout />;
}
