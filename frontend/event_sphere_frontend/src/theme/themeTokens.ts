/**
 * Theme Tokens and Utilities
 * Constants and utility functions for the design system
 * Separated from components to fix Fast Refresh warnings
 */

/**
 * ENHANCED THEME TOKENS
 * Using a sophisticated "Slate & Violet" professional palette
 */
export const designTokens = {
  dark: {
    bg: '#020617', // Deep Navy/Slate
    surface: '#0f172a', // Slate 900
    surfaceLight: '#1e293b', // Slate 800
    border: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#8b5cf6', // Violet 500
    accentGlow: 'rgba(139, 92, 246, 0.3)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  light: {
    bg: '#f8fafc', // Light background
    surface: '#ffffff', // White
    surfaceLight: '#f1f5f9', // Slate 100
    border: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accent: '#8b5cf6', // Violet 500
    accentGlow: 'rgba(139, 92, 246, 0.2)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  }
};

// Get active theme from store (will be set dynamically)
// This function should be called within components that use the theme store
export const getActiveTheme = (mode: 'dark' | 'light' = 'dark') => {
  return designTokens[mode];
};

// Default export for backward compatibility
export const activeTheme = designTokens.dark;

