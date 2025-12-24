/**
 * MetricCard Component
 * Displays single metric with icon, value, label, trend if applicable
 * Implements T188
 */

import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';

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
        return 'primary.main';
      case 'secondary':
        return 'secondary.main';
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      case 'info':
        return 'info.main';
      default:
        return 'primary.main';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            {title}
          </Typography>
          {icon && (
            <Avatar sx={{ bgcolor: getColorValue(), width: 40, height: 40 }}>
              {icon}
            </Avatar>
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {getTrendIcon()}
            <Typography
              variant="caption"
              color={trend.direction === 'up' ? 'success.main' : trend.direction === 'down' ? 'error.main' : 'text.secondary'}
            >
              {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
              {Math.abs(trend.value)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

