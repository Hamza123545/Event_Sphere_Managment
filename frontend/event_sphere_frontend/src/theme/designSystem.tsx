/**
 * Shared Design System
 * Modern dark theme with glass morphism effects
 * Used across all pages for consistent UI
 */

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useThemeStore } from '../stores/themeStore';

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
export const  getActiveTheme = (mode: 'dark' | 'light' = 'dark') => {
  return designTokens[mode];
};

// Default export for backward compatibility
export const activeTheme = designTokens.dark;

/**
 * ANIMATED UI COMPONENTS
 */
export const MotionBox = motion(Box);

interface GlassContainerProps {
  children: React.ReactNode;
  sx?: Record<string, unknown>;
  delay?: number;
}

export const GlassContainer = ({ children, sx = {}, delay = 0 }: GlassContainerProps) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    sx={{
      background: activeTheme.surface,
      borderRadius: '24px',
      border: `1px solid ${activeTheme.border}`,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      position: 'relative',
      ...sx,
    }}
  >
    {children}
  </MotionBox>
);

interface GlassCardProps {
  children: React.ReactNode;
  sx?: Record<string, unknown>;
  delay?: number;
  onClick?: () => void;
}

export const GlassCard = ({ children, sx = {}, delay = 0, onClick }: GlassCardProps) => (
  <MotionBox
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ 
      y: -5, 
      backgroundColor: activeTheme.surfaceLight,
      borderColor: 'rgba(139, 92, 246, 0.4)',
      boxShadow: `0 10px 30px -10px ${activeTheme.accentGlow}`
    }}
    onClick={onClick}
    sx={{
      background: 'rgba(15, 23, 42, 0.6)',
      borderRadius: '16px',
      border: `1px solid ${activeTheme.border}`,
      padding: '24px',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      ...sx,
    }}
  >
    {children}
  </MotionBox>
);

interface ActionButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  sx?: Record<string, unknown>;
  [key: string]: unknown;
}

export const ActionButton = ({ children, primary = false, sx, ...props }: ActionButtonProps) => (
  <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Button
      {...(props as Record<string, unknown>)}
      sx={{
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 600,
        px: 3,
        py: 1,
        transition: 'all 0.3s ease',
        background: primary ? activeTheme.accent : 'rgba(255,255,255,0.03)',
        color: '#fff',
        border: primary ? 'none' : `1px solid ${activeTheme.border}`,
        '&:hover': {
          background: primary ? '#7c3aed' : 'rgba(255,255,255,0.08)',
          boxShadow: primary ? `0 0 20px ${activeTheme.accentGlow}` : 'none',
        },
        ...(sx || {}),
      } as Record<string, unknown>}
    >
      {children}
    </Button>
  </MotionBox>
);

/**
 * Background glows component
 */
export const BackgroundGlows = () => (
  <>
    <Box sx={{
      position: 'fixed', top: -100, left: -100, width: 400, height: 400,
      background: `radial-gradient(circle, ${activeTheme.accentGlow} 0%, transparent 70%)`,
      zIndex: 0, pointerEvents: 'none'
    }} />
    <Box sx={{
      position: 'fixed', bottom: -100, right: -100, width: 500, height: 500,
      background: `radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)`,
      zIndex: 0, pointerEvents: 'none'
    }} />
  </>
);

/**
 * Page container wrapper with consistent styling
 */
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  sx?: Record<string, unknown>;
}

export const PageContainer = ({ children, maxWidth = 'xl', sx = {} }: PageContainerProps) => {
  // Use React hook to get theme mode
  const mode = useThemeStore((state: { mode: 'dark' | 'light' }) => state.mode);
  const theme = getActiveTheme(mode);
  
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: theme.bg,
      color: theme.textPrimary,
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      pb: 10,
      overflowX: 'hidden',
      position: 'relative',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      ...sx,
    }}>
      <BackgroundGlows />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {maxWidth !== false ? (
          <Box sx={{ maxWidth: maxWidth === 'xl' ? '1400px' : undefined, mx: 'auto', px: { xs: 3, md: 8 }, ...sx }}>
            {children}
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

/**
 * Section title component
 */
interface SectionTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionTitle = ({ children, subtitle, action }: SectionTitleProps) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: subtitle ? 0.5 : 0 }}>
        {children}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action && action}
  </Box>
);

/**
 * Stat card component
 */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  delay?: number;
}

export const StatCard = ({ label, value, icon, color, change, delay = 0 }: StatCardProps) => (
  <GlassCard delay={delay}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box sx={{ 
        p: 1.5, borderRadius: '12px', 
        background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`, 
        color: color, border: `1px solid ${color}30`
      }}>
        {icon}
      </Box>
      {change && (
        <Box
          component="span"
          sx={{ 
            bgcolor: 'rgba(16, 185, 129, 0.1)', 
            color: '#10b981', 
            fontWeight: 700, 
            fontSize: '0.7rem',
            px: 1,
            py: 0.5,
            borderRadius: '6px'
          }}
        >
          {change}
        </Box>
      )}
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{value}</Typography>
    <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600, letterSpacing: '0.5px' }}>
      {label.toUpperCase()}
    </Typography>
  </GlassCard>
);


