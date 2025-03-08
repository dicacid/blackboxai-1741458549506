import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';

interface TooltipData {
  label: string;
  value: number | string;
  color?: string;
  change?: number;
  unit?: string;
  info?: string;
}

interface AnalyticsTooltipProps {
  className?: string;
  title?: string;
  subtitle?: string;
  timestamp?: string;
  data: TooltipData[];
  total?: number | string;
  comparison?: {
    label: string;
    value: number | string;
    change: number;
  };
  formatValue?: (value: number | string) => string;
  formatChange?: (change: number) => string;
}

const defaultFormatValue = (value: number | string) => {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
};

const defaultFormatChange = (change: number) => {
  const formatted = Math.abs(change).toFixed(1);
  return change > 0 ? `+${formatted}%` : `${formatted}%`;
};

const AnalyticsTooltip: React.FC<AnalyticsTooltipProps> = ({
  className,
  title,
  subtitle,
  timestamp,
  data,
  total,
  comparison,
  formatValue = defaultFormatValue,
  formatChange = defaultFormatChange,
}) => {
  const theme = useTheme();

  const renderTrend = (change: number) => {
    const Icon = change > 0 ? TrendingUpIcon : change < 0 ? TrendingDownIcon : TrendingFlatIcon;
    const color = change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color,
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
        <Typography variant="caption" color="inherit">
          {formatChange(change)}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      className={className}
      elevation={3}
      sx={{
        p: 1.5,
        maxWidth: 300,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      {(title || timestamp) && (
        <Box sx={{ mb: 1 }}>
          {title && (
            <Typography variant="subtitle2" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" display="block">
              {subtitle}
            </Typography>
          )}
          {timestamp && (
            <Typography variant="caption" color="text.secondary">
              {timestamp}
            </Typography>
          )}
        </Box>
      )}

      {/* Data Points */}
      <Box sx={{ my: 1 }}>
        {data.map((item, index) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 0.5,
              '&:not(:last-child)': {
                borderBottom: 1,
                borderColor: 'divider',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.color && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: item.color,
                  }}
                />
              )}
              <Typography variant="body2">
                {item.label}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2" fontWeight="medium">
                {formatValue(item.value)}
                {item.unit && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    {item.unit}
                  </Typography>
                )}
              </Typography>
              {item.change !== undefined && renderTrend(item.change)}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Total */}
      {total !== undefined && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="subtitle2">Total</Typography>
            <Typography variant="subtitle2">
              {formatValue(total)}
            </Typography>
          </Box>
        </>
      )}

      {/* Comparison */}
      {comparison && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {comparison.label}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2">
                {formatValue(comparison.value)}
              </Typography>
              {renderTrend(comparison.change)}
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

// Helper components for common tooltip variants
export const SimpleTooltip: React.FC<Omit<AnalyticsTooltipProps, 'comparison' | 'total'>> = (props) => (
  <AnalyticsTooltip {...props} />
);

export const ComparisonTooltip: React.FC<Omit<AnalyticsTooltipProps, 'total'>> = (props) => (
  <AnalyticsTooltip {...props} />
);

export const DetailedTooltip: React.FC<AnalyticsTooltipProps> = (props) => (
  <AnalyticsTooltip {...props} />
);

export default AnalyticsTooltip;
