import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SSP_ROLES } from '../lib/permissions';

/** Legacy route — admin workspace uses Dashboard + header nav (STK style). */
export default function AdminPanel() {
  const { activeRole } = useAuth();
  if (activeRole === SSP_ROLES.admin) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/" replace />;
}
