import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  Tooltip,
  IconButton,
  Alert,
  Fade,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  InfoOutlined as InfoIcon,
  Refresh as RefreshIcon,
  LocalOffer as OfferIcon,
  AccountBalance as MarketCapIcon,
  ShowChart as VolumeIcon,
  PriceChange as PriceIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { 
  MarketStats,
  MarketStat,
  ChartData,
  ApiError 
} from '../../types';
import analyticsService from '../../services/analyticsService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface StatCardProps {
  stat: MarketStat;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ stat, icon }) => {
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
          },
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
            mb: 1,
          }}>
            <Typography variant="h6" component="div">
              {stat.value}
            </Typography>
            <Tooltip title={stat.tooltip} arrow placement="top">
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 1 }}
          >
            {stat.label}
          </Typography>
          {stat.change !== undefined && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.change >= 0 ? theme.palette.success.main : theme.palette.error.main,
              }}
            >
              {stat.change >= 0 ? (
                <TrendingUpIcon fontSize="small" />
              ) : (
                <TrendingDownIcon fontSize="small" />
              )}
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {Math.abs(stat.change)}%
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

const MarketOverview: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [marketStats, setMarketStats] = React.useState<MarketStat[]>([]);
  const [volumeData, setVolumeData] = React.useState<ChartData | null>(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, volume] = await Promise.all([
        analyticsService.getMarketStats(),
        analyticsService.getVolumeData('week')
      ]);

      setMarketStats(analyticsService.formatMarketStats(stats));
      setVolumeData(volume);
      setLoading(false);
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Failed to fetch market data',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMarketData();

    // Subscribe to real-time updates
    const unsubscribe = analyticsService.subscribeToMarketUpdates((stats) => {
      setMarketStats(analyticsService.formatMarketStats(stats));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 400,
      }}>
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
            onClick={fetchMarketData}
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

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
      }}>
        <Typography variant="h6">
          Market Overview
        </Typography>
        <Tooltip title="Refresh market data" arrow>
          <IconButton onClick={fetchMarketData} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Market Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {marketStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard 
              stat={stat} 
              icon={
                index === 0 ? <VolumeIcon /> :
                index === 1 ? <OfferIcon /> :
                index === 2 ? <PriceIcon /> :
                <MarketCapIcon />
              }
            />
          </Grid>
        ))}
      </Grid>

      {/* Volume Chart */}
      {volumeData && (
        <Box sx={{ height: 300 }}>
          <Line
            data={volumeData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  backgroundColor: theme.palette.background.paper,
                  titleColor: theme.palette.text.primary,
                  bodyColor: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  borderWidth: 1,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: theme.palette.text.secondary,
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: theme.palette.text.secondary,
                  },
                },
              },
              interaction: {
                intersect: false,
                mode: 'index',
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default MarketOverview;
