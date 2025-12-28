import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand persist to hydrate
  useEffect(() => {
    // Small delay to ensure store is hydrated
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  // Wait for hydration before checking auth
  if (!isHydrated) {
    return null; // or a loading spinner
  }

  // Check authentication - also verify token exists in localStorage
  const storedToken = localStorage.getItem('auth_token');
  const hasValidAuth = isAuthenticated && user && (token || storedToken);
  
  if (!hasValidAuth) {
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

