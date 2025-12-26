import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore, UserRole } from '../../stores/authStore';
import { connectSocket, getSocket } from '../../services/socket';

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
  const { isAuthenticated, user, token } = useAuthStore();
  const location = useLocation();

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && token) {
      const currentSocket = getSocket();
      // Only connect if not already connected
      if (!currentSocket || !currentSocket.connected) {
        connectSocket(token);
      }
    }
  }, [isAuthenticated, user, token]);

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

