import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SSP_ROLES } from '../lib/permissions';
import Dashboard from '../pages/Dashboard';

/** Santo & coordinator skip dashboard — land on orders workspace. */
export default function HomeRoute() {
  const { activeRole } = useAuth();

  if (activeRole === SSP_ROLES.santo || activeRole === SSP_ROLES.coordinator) {
    return <Navigate to="/orders" replace />;
  }

  return <Dashboard />;
}
