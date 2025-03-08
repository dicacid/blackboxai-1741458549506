import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  LocalOffer as PriceIcon,
  ShoppingCart as VolumeIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import type { ChartTooltipProps } from '../../types';

interface MarketAnalyticsProps {
  className?: string;
}

interface MarketMetrics {
  overview: {
    totalVolume: number;
    activeListings: number;
    avgPrice: number;
    priceChange: number;
    volumeChange: number;
    listingChange: number;
  };
  trends: {
    price: Array<{
      timestamp: string;
      price: number;
      volume: number;
      listings: number;
    }>;
    distribution: Array<{
      priceRange: string;
      count: number;
      volume: number;
      percentage: number;
    }>;
  };
  topPerformers: Array<{
    eventId: string;
    name: string;
    price: number;
    priceChange: number;
    volume: number;
    volumeChange: number;
    listings: number;
  }>;
  recentTrades: Array<{
    id: string;
    eventId: string;
    eventName: string;
    price: number;
    quantity: number;
    buyer: string;
    seller: string;
    timestamp: string;
  }>;
}

const MarketAnalytics: React.FC<MarketAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(prevLoading => !metrics && prevLoading);
      // Simulated data - in a real app, this would be an API call
      const data: MarketMetrics = {
        overview: {
          totalVolume: 1000000 + Math.random() * 200000,
          activeListings: 500 + Math.random() * 100,
          avgPrice: 200 + Math.random() * 50,
          priceChange: -5 + Math.random() * 10,
          volumeChange: -10 + Math.random() * 20,
          listingChange: -3 + Math.random() * 6,
        },
        trends: {
          price: generatePriceTrends(),
          distribution: generatePriceDistribution(),
        },
        topPerformers: generateTopPerformers(),
        recentTrades: generateRecentTrades(),
      };
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch market data');
      console.error('Error fetching market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePriceTrends = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (24 - i - 1));
      const basePrice = 200;
      const baseVolume = 50000;
      const baseListings = 500;
      
      return {
        timestamp: date.toISOString(),
        price: basePrice + Math.sin(i / 4) * 20 + Math.random() * 10,
        volume: baseVolume + Math.cos(i / 6) * 10000 + Math.random() * 5000,
        listings: baseListings + Math.sin(i / 8) * 50 + Math.random() * 20,
      };
    });
  };

  const generatePriceDistribution = () => {
    const ranges = ['0-100', '100-200', '200-500', '500-1000', '>1000'];
    return ranges.map((range, index) => {
      const count = 100 - index * 15 + Math.random() * 10;
      return {
        priceRange: range,
        count: Math.floor(count),
        volume: count * (parseInt(range.split('-')[0]) || 1000),
        percentage: count,
      };
    });
  };

  const generateTopPerformers = () => {
    const events = [
      'Summer Music Festival',
      'Tech Conference 2024',
      'Sports Championship',
      'Art Exhibition',
      'Comedy Night',
    ];
    
    return events.map((name, index) => ({
      eventId: `EVT-${1000 + index}`,
      name,
      price: 100 + Math.random() * 400,
      priceChange: -20 + Math.random() * 40,
      volume: 10000 + Math.random() * 50000,
      volumeChange: -30 + Math.random() * 60,
      listings: 20 + Math.random() * 30,
    }));
  };

  const generateRecentTrades = () => {
    const events = [
      'Summer Music Festival',
      'Tech Conference 2024',
      'Sports Championship',
      'Art Exhibition',
      'Comedy Night',
    ];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `TRD-${1000 + i}`,
      eventId: `EVT-${1000 + Math.floor(Math.random() * 5)}`,
      eventName: events[Math.floor(Math.random() * events.length)],
      price: 100 + Math.random() * 400,
      quantity: 1 + Math.floor(Math.random() * 4),
      buyer: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      seller: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderOverviewCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Trading Volume',
        value: formatCurrency(metrics.overview.totalVolume),
        change: metrics.overview.volumeChange,
        icon: <VolumeIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.primary.main,
      },
      {
        title: 'Average Price',
        value: formatCurrency(metrics.overview.avgPrice),
        change: metrics.overview.priceChange,
        icon: <PriceIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.secondary.main,
      },
      {
        title: 'Active Listings',
        value: metrics.overview.activeListings.toLocaleString(),
        change: metrics.overview.listingChange,
        icon: <StatsIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.success.main,
      },
      {
        title: 'Market Trend',
        value: metrics.overview.priceChange >= 0 ? 'Upward' : 'Downward',
        change: metrics.overview.priceChange,
        icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.info.main,
      },
    ];

    return (
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: `${card.color}20`,
                      color: card.color,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6">{card.title}</Typography>
                    <Typography variant="h4">{card.value}</Typography>
                    <Typography
                      variant="body2"
                      color={card.change >= 0 ? 'success.main' : 'error.main'}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderPriceTrends = () => {
    if (!metrics) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(label).toLocaleTimeString()}
            </Typography>
            <Typography variant="body1" color="primary.main">
              Price: {formatCurrency(payload[0].value)}
            </Typography>
            <Typography variant="body1" color="secondary.main">
              Volume: {formatCurrency(payload[1].value)}
            </Typography>
            <Typography variant="body1" color="success.main">
              Listings: {payload[2].value}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer>
          <AreaChart data={metrics.trends.price}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => new Date(value).toLocaleTimeString()}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="price"
              name="Price"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              name="Volume"
              stroke={theme.palette.secondary.main}
              fill={theme.palette.secondary.main}
              fillOpacity={0.2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="listings"
              name="Listings"
              stroke={theme.palette.success.main}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderTopPerformers = () => {
    if (!metrics) return null;

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Event</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Price Change</TableCell>
              <TableCell align="right">Volume</TableCell>
              <TableCell align="right">Volume Change</TableCell>
              <TableCell align="right">Listings</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.topPerformers.map((event) => (
              <TableRow key={event.eventId}>
                <TableCell>{event.name}</TableCell>
                <TableCell align="right">{formatCurrency(event.price)}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={event.priceChange >= 0 ? 'success.main' : 'error.main'}
                  >
                    {event.priceChange >= 0 ? '+' : ''}{event.priceChange.toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatCurrency(event.volume)}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={event.volumeChange >= 0 ? 'success.main' : 'error.main'}
                  >
                    {event.volumeChange >= 0 ? '+' : ''}{event.volumeChange.toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell align="right">{event.listings}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (error) {
    return (
      <Alert severity="error" className={className}>
        {error}
      </Alert>
    );
  }

  if (loading || !metrics) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {renderOverviewCards()}
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Market Trends
            </Typography>
            {renderPriceTrends()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Performers
            </Typography>
            {renderTopPerformers()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketAnalytics;
