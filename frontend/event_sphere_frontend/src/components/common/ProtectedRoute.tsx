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
  const { isAuthenticated, user, token, _hasHydrated, setHasHydrated } = useAuthStore();
  const location = useLocation();
  const [localHydrated, setLocalHydrated] = useState(false);

  // Wait for Zustand persist to hydrate
  useEffect(() => {
    // Check if Zustand has hydrated
    const checkHydration = (): (() => void) | void => {
      // Zustand persist stores data in localStorage with the key 'auth-storage'
      const stored = localStorage.getItem('auth-storage');
      const storedToken = localStorage.getItem('auth_token');
      
      // If Zustand says it's hydrated, we're good
      if (_hasHydrated) {
        setLocalHydrated(true);
        return;
      }
      
      // If we have stored data or token, wait for Zustand to hydrate
      if (stored || storedToken) {
        // Give Zustand time to hydrate from localStorage
        const timer = setTimeout(() => {
          // Check again if hydrated
          const currentState = useAuthStore.getState();
          if (currentState._hasHydrated || currentState.user || currentState.token) {
            setLocalHydrated(true);
          } else {
            // Still not hydrated, but we have data - force hydration check
            setHasHydrated(true);
            setLocalHydrated(true);
          }
        }, 300);
        return () => clearTimeout(timer);
      } else {
        // No stored data, we can check immediately
        setLocalHydrated(true);
        return;
      }
    };
    
    return checkHydration();
  }, [_hasHydrated, setHasHydrated]);

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
  if (!localHydrated) {
    return null; // or a loading spinner
  }

  // Check authentication - prioritize localStorage token as source of truth
  const storedToken = localStorage.getItem('auth_token');
  const storedAuth = localStorage.getItem('auth-storage');
  
  // If we have a token in localStorage but Zustand hasn't hydrated yet, 
  // try to parse the stored auth data
  let hasValidAuth: boolean = Boolean(isAuthenticated && user && (token || storedToken));
  
  // If Zustand says not authenticated but we have a token, check stored data
  if (!hasValidAuth && storedToken && storedAuth) {
    try {
      const parsed = JSON.parse(storedAuth);
      if (parsed.state && parsed.state.user && parsed.state.token) {
        // We have valid stored auth, but Zustand hasn't hydrated yet
        // Give it a moment and re-check
        hasValidAuth = true;
      }
    } catch {
      // Invalid stored data, ignore
    }
  }
  
  if (!hasValidAuth || !user) {
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

