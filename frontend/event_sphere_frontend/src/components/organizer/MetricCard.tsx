/**
 * MetricCard Component
 * Displays single metric with icon, value, label, trend if applicable
 * Implements T188
 */

import { Typography, Box, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import {
  GlassCard,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  subtitle,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <TrendingUp fontSize="small" color="success" />;
      case 'down':
        return <TrendingDown fontSize="small" color="error" />;
      default:
        return <Remove fontSize="small" color="action" />;
    }
  };

  const getColorValue = () => {
    switch (color) {
      case 'primary':
        return activeTheme.accent;
      case 'secondary':
        return activeTheme.textSecondary;
      case 'success':
        return activeTheme.success;
      case 'warning':
        return activeTheme.warning;
      case 'error':
        return activeTheme.error;
      case 'info':
        return activeTheme.info;
      default:
        return activeTheme.accent;
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <GlassCard sx={{ height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 700 }}>
            {title}
          </Typography>
          {icon && (
            <Avatar sx={{ bgcolor: `${getColorValue()}20`, width: 48, height: 48, border: `2px solid ${getColorValue()}30` }}>
              <Box sx={{ color: getColorValue() }}>{icon}</Box>
            </Avatar>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: activeTheme.textPrimary }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600, display: 'block', mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            {getTrendIcon()}
            <Typography
              variant="caption"
              sx={{
                color: trend.direction === 'up' ? activeTheme.success : 
                       trend.direction === 'down' ? activeTheme.error : 
                       activeTheme.textSecondary,
                fontWeight: 700
              }}
            >
              {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
              {Math.abs(trend.value)}%
            </Typography>
          </Box>
        )}
      </GlassCard>
    </MotionBox>
  );
}

