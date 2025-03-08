import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface AnalyticsMetricProps {
  className?: string;
  title: string;
  value: number;
  change?: number;
  target?: number;
  unit?: string;
  prefix?: string;
  info?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  precision?: number;
  loading?: boolean;
  error?: string;
  onClick?: () => void;
  onMoreClick?: () => void;
}

const AnalyticsMetric: React.FC<AnalyticsMetricProps> = ({
  className,
  title,
  value,
  change,
  target,
  unit,
  prefix,
  info,
  icon,
  iconColor,
  precision = 2,
  loading,
  error,
  onClick,
  onMoreClick,
}) => {
  const theme = useTheme();

  const formatValue = (value: number): string => {
    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    }
    if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toFixed(precision);
  };

  const formatChange = (change: number): string => {
    const formatted = Math.abs(change).toFixed(1);
    return change > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const getTrendColor = (change: number): string => {
    if (change > 0) return theme.palette.success.main;
    if (change < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUpIcon />;
    if (change < 0) return <TrendingDownIcon />;
    return <TrendingFlatIcon />;
  };

  const getProgressColor = (value: number, target: number): string => {
    const ratio = value / target;
    if (ratio >= 1) return theme.palette.success.main;
    if (ratio >= 0.7) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[2],
        } : undefined,
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon && (
          <Box
            sx={{
              mr: 1,
              display: 'flex',
              alignItems: 'center',
              color: iconColor || 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}

        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ flex: 1 }}
        >
          {title}
        </Typography>

        {info && (
          <Tooltip title={info}>
            <InfoIcon
              sx={{
                fontSize: 16,
                color: 'action.active',
                cursor: 'help',
                mr: onMoreClick ? 1 : 0,
              }}
            />
          </Tooltip>
        )}

        {onMoreClick && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMoreClick();
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          {prefix && (
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mr: 0.5 }}
            >
              {prefix}
            </Typography>
          )}

          <Typography variant="h4">
            {formatValue(value)}
          </Typography>

          {unit && (
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ ml: 0.5 }}
            >
              {unit}
            </Typography>
          )}
        </Box>

        {change !== undefined && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: getTrendColor(change),
            }}
          >
            {getTrendIcon(change)}
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              {formatChange(change)}
            </Typography>
          </Box>
        )}

        {target !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                width: '100%',
                height: 4,
                bgcolor: 'action.hover',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${Math.min((value / target) * 100, 100)}%`,
                  height: '100%',
                  bgcolor: getProgressColor(value, target),
                  transition: 'width 0.3s ease-in-out',
                }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              Target: {formatValue(target)}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// Helper components for common metric types
export const SimpleMetric: React.FC<Omit<AnalyticsMetricProps, 'change' | 'target'>> = (props) => (
  <AnalyticsMetric {...props} />
);

export const TrendMetric: React.FC<Omit<AnalyticsMetricProps, 'target'>> = (props) => (
  <AnalyticsMetric {...props} />
);

export const ProgressMetric: React.FC<Omit<AnalyticsMetricProps, 'change'>> = (props) => (
  <AnalyticsMetric {...props} />
);

export const CompleteMetric: React.FC<AnalyticsMetricProps> = (props) => (
  <AnalyticsMetric {...props} />
);

export default AnalyticsMetric;
