import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Tooltip,
  IconButton,
  Alert,
  Paper,
  Fade,
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  ConfirmationNumber as TicketIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as PriceIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { EventStats as EventStatsType, StatItemProps, ApiError } from '../../types';
import analyticsService from '../../services/analyticsService';

const StatItem: React.FC<StatItemProps> = ({ label, value, change, tooltip, icon }) => {
  const theme = useTheme();

  return (
    <Fade in={true} timeout={500}>
      <Paper 
        elevation={1}
        sx={{ 
          p: 2,
          height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[3],
          }
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          {icon && (
            <Box sx={{ mb: 1, color: theme.palette.primary.main }}>
              {icon}
            </Box>
          )}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 1 
          }}>
            <Typography variant="h6" component="div">
              {value}
            </Typography>
            {tooltip && (
              <Tooltip title={tooltip} arrow placement="top">
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography 
            variant="body2" 
            color="textSecondary"
            sx={{ mb: 1 }}
          >
            {label}
          </Typography>
          {change !== undefined && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: change >= 0 ? theme.palette.success.main : theme.palette.error.main,
              }}
            >
              {change >= 0 ? (
                <TrendingUpIcon fontSize="small" />
              ) : (
                <TrendingDownIcon fontSize="small" />
              )}
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {Math.abs(change)}%
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

const EventStats: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [stats, setStats] = React.useState<EventStatsType>({
    activeEvents: 0,
    totalTickets: 0,
    avgPrice: 0,
    soldOut: 0,
    totalRevenue: 0,
    ticketsSold: 0,
    percentageSold: 0,
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventStats = await analyticsService.getEventStats();
      setStats(eventStats);
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Failed to fetch event statistics',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();

    // Subscribe to real-time updates
    const unsubscribe = analyticsService.subscribeToEventUpdates((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={fetchStats}
            aria-label="retry"
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        {error.message}
      </Alert>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6">
          Event Statistics
        </Typography>
        <Tooltip title="Refresh statistics" arrow>
          <IconButton onClick={fetchStats} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatItem
            label="Active Events"
            value={formatNumber(stats.activeEvents)}
            change={5.2}
            tooltip="Total number of active events"
            icon={<EventIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatItem
            label="Total Tickets"
            value={formatNumber(stats.totalTickets)}
            change={-2.1}
            tooltip="Total tickets available across all events"
            icon={<TicketIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatItem
            label="Average Price"
            value={formatCurrency(stats.avgPrice)}
            change={1.8}
            tooltip="Average ticket price across all events"
            icon={<PriceIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatItem
            label="Sold Out Events"
            value={formatNumber(stats.soldOut)}
            tooltip="Number of sold out events"
            icon={<EventIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatItem
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            change={8.5}
            tooltip="Total revenue from all ticket sales"
            icon={<MoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatItem
            label="Tickets Sold"
            value={formatNumber(stats.ticketsSold)}
            tooltip="Total number of tickets sold"
            icon={<TicketIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatItem
            label="Percentage Sold"
            value={`${stats.percentageSold}%`}
            change={3.2}
            tooltip="Percentage of total tickets sold"
            icon={<TrendingUpIcon />}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventStats;
