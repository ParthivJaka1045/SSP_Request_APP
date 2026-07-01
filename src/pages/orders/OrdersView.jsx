import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canUseManagerOrdersWorkspace } from '../../lib/permissions';
import ManagerOrdersWorkspace from './ManagerOrdersWorkspace';
import MemberOrdersWorkspace from './MemberOrdersWorkspace';

export default function OrdersView() {
  const { currentUser, activeRole } = useAuth();

  if (canUseManagerOrdersWorkspace(currentUser, activeRole)) {
    return <ManagerOrdersWorkspace />;
  }

  return <MemberOrdersWorkspace />;
}
