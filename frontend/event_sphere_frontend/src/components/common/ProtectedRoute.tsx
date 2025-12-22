import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute component
 * Implements constitutional requirement for Role-Based Access Control
 * Auth check, role check, redirect logic
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Admin has access to everything
    if (user.role !== 'admin' && !roles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      const roleDashboard: Record<UserRole, string> = {
        admin: '/admin',
        organizer: '/organizer',
        exhibitor: '/exhibitor',
        attendee: '/attendee',
      };

      return <Navigate to={roleDashboard[user.role] || '/login'} replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;

