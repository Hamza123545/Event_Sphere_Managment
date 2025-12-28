import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Authentication Zustand store
 * Implements constitutional requirement for user state management
 * User state, login, logout, token management
 */

export type UserRole = 'admin' | 'organizer' | 'exhibitor' | 'attendee';

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      login: (user, token) => {
        // Trim token to remove any whitespace before storing
        const trimmedToken = token.trim();
        
        // Store token in both localStorage and Zustand for redundancy
        localStorage.setItem('auth_token', trimmedToken);
        set({
          user,
          token: trimmedToken,
          isAuthenticated: true,
        });
        // Force persist immediately
        if (typeof window !== 'undefined') {
          // Trigger a small delay to ensure persistence
          setTimeout(() => {
            // Verify it was persisted
            const stored = localStorage.getItem('auth-storage');
            if (!stored) {
              // If not persisted, try again
              localStorage.setItem('auth_token', token);
            }
          }, 50);
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        // Clear Zustand persist storage
        localStorage.removeItem('auth-storage');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Sync with localStorage on hydration
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Mark as hydrated
            state._hasHydrated = true;
            
            // Ensure token is synced from localStorage if it exists
            const storedToken = localStorage.getItem('auth_token');
            if (storedToken && storedToken !== state.token) {
              state.token = storedToken;
              // If we have a token but no user, we're not fully authenticated
              if (!state.user) {
                state.isAuthenticated = false;
              }
            }
            // If we have user and token, ensure isAuthenticated is true
            if (state.user && state.token) {
              state.isAuthenticated = true;
            }
          }
        };
      },
    }
  )
);

