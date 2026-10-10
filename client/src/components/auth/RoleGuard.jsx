import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * RoleGuard — wraps routes that require a specific user role.
 * Must be used INSIDE a ProtectedRoute (user is already authenticated).
 *
 * Usage:
 *   <RoleGuard allowedRoles={['owner', 'admin']}>
 *     <OwnerDashboard />
 *   </RoleGuard>
 *
 * @param {string[]} allowedRoles - Array of roles permitted to access this route
 */
export default function RoleGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-sm text-gray-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
