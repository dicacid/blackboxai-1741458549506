import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
  useTheme,
  SxProps,
  Theme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  LocalActivity as TicketIcon,
  Timeline as TimelineIcon,
  AccountBalance as VolumeIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import type { MarketStats } from '../../types';
import eventService from '../../services/eventService';

interface MarketplaceStatsProps {
  stats: MarketStats;
  loading?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  tooltip?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  tooltip,
  loading,
}) => {
  const theme = useTheme();

  return (
    <Tooltip title={tooltip || ''} arrow>
      <Paper
        sx={{
          p: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.main,
                  mr: 2,
                }}
              >
                {icon}
              </Box>
              <Typography variant="subtitle2" color="text.secondary">
                {title}
              </Typography>
            </Box>

            <Typography variant="h4" gutterBottom>
              {value}
            </Typography>

            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon
                  sx={{
                    mr: 0.5,
                    color: change >= 0 ? 'success.main' : 'error.main',
                    transform: change >= 0 ? 'none' : 'rotate(180deg)',
                  }}
                  fontSize="small"
                />
                <Typography
                  variant="body2"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                >
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </Typography>
              </Box>
            )}

            {/* Background decoration */}
            <Box
              sx={{
                position: 'absolute',
                right: -20,
                bottom: -20,
                opacity: 0.1,
                transform: 'rotate(-15deg)',
              }}
            >
              {icon}
            </Box>
          </>
        )}
      </Paper>
    </Tooltip>
  );
};

const MarketplaceStats: React.FC<MarketplaceStatsProps> = ({
  stats,
  loading = false,
  className,
  sx,
}) => {
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getVolumeChange = (): number => {
    const previousVolume = stats.weeklyVolume - stats.dailyVolume;
    return calculateChange(stats.dailyVolume, previousVolume / 7); // Compare to average daily volume
  };

  return (
    <Box className={className} sx={sx}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Trading Volume (24h)"
            value={eventService.formatPrice(stats.dailyVolume)}
            change={getVolumeChange()}
            icon={<VolumeIcon />}
            tooltip="Total trading volume in the last 24 hours"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Listings"
            value={stats.activeListings.toString()}
            icon={<TicketIcon />}
            tooltip="Number of tickets currently listed for sale"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Resale Price"
            value={eventService.formatPrice(stats.avgResalePrice)}
            icon={<ChartIcon />}
            tooltip="Average price of resold tickets"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Market Cap"
            value={eventService.formatPrice(stats.marketCap)}
            icon={<TimelineIcon />}
            tooltip="Total value of all listed tickets"
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketplaceStats;
