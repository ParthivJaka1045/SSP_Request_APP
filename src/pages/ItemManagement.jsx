import { Navigate, useParams } from 'react-router-dom';

/** Legacy route — redirects to unified Masters page. */
export default function ItemManagement() {
  const { category } = useParams();
  return <Navigate to={`/admin/masters?module=${category || 'technical'}`} replace />;
}
