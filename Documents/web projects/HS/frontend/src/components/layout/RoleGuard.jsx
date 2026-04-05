import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '../../features/auth/hooks';

export const RoleGuard = ({ allowedRoles, children }) => {
  const location = useLocation();
  const meQuery = useMe();

  if (meQuery.isLoading) {
    return <div className="p-4 text-sm text-(--text-soft)">Checking access...</div>;
  }

  if (meQuery.isError || !meQuery.data?.role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = meQuery.data.role;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};


