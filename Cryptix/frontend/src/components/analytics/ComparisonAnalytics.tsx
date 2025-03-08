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
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp as GrowthIcon,
  TrendingDown as DeclineIcon,
  RemoveCircle as NeutralIcon,
} from '@mui/icons-material';
import type { AnalyticsMetrics, TimeSeriesData, ChartTooltipProps } from '../../types';
import analyticsService from '../../services/analyticsService';

interface ComparisonAnalyticsProps {
  className?: string;
}

type MetricType = 'users' | 'revenue' | 'tickets' | 'listings';
type TimePeriod = 'day' | 'week' | 'month' | 'year';
type TrendType = 'up' | 'down' | 'neutral';

interface ComparisonData {
  current: TimeSeriesData[];
  previous: TimeSeriesData[];
  change: number;
  summary: {
    current: number;
    previous: number;
    trend: TrendType;
  };
}

const ComparisonAnalytics: React.FC<ComparisonAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('users');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    fetchComparisonData();
  }, [selectedMetric, selectedPeriod]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnalyticsMetrics();
      setMetrics(data);

      // Generate comparison data
      const currentData = generateTimeSeriesData(data, true);
      const previousData = generateTimeSeriesData(data, false);
      const currentTotal = currentData.reduce((sum, point) => sum + point.value, 0);
      const previousTotal = previousData.reduce((sum, point) => sum + point.value, 0);
      const change = ((currentTotal - previousTotal) / previousTotal) * 100;

      setComparisonData({
        current: currentData,
        previous: previousData,
        change,
        summary: {
          current: currentTotal,
          previous: previousTotal,
          trend: change > 1 ? 'up' : change < -1 ? 'down' : 'neutral',
        },
      });
    } catch (err) {
      setError('Failed to fetch comparison data');
      console.error('Error fetching comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (data: AnalyticsMetrics, isCurrent: boolean): TimeSeriesData[] => {
    const points = selectedPeriod === 'day' ? 24 : selectedPeriod === 'week' ? 7 : 30;
    const baseValue = getBaseValue(data);
    
    return Array.from({ length: points }, (_, i) => {
      const date = new Date();
      if (!isCurrent) {
        date.setMonth(date.getMonth() - 1);
      }
      
      if (selectedPeriod === 'day') {
        date.setHours(date.getHours() - (points - i - 1));
      } else if (selectedPeriod === 'week') {
        date.setDate(date.getDate() - (points - i - 1));
      } else {
        date.setDate(date.getDate() - (points - i - 1));
      }

      return {
        timestamp: date.toISOString(),
        value: baseValue * (0.8 + Math.random() * 0.4),
        change: (Math.random() * 20) - 10,
      };
    });
  };

  const getBaseValue = (data: AnalyticsMetrics): number => {
    switch (selectedMetric) {
      case 'users':
        return data.userStats.activeUsers;
      case 'revenue':
        return data.eventStats.totalRevenue;
      case 'tickets':
        return data.eventStats.ticketsSold;
      case 'listings':
        return data.marketStats.activeListings;
      default:
        return 0;
    }
  };

  const formatValue = (value: number): string => {
    if (selectedMetric === 'revenue') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const getTrendColor = (trend: TrendType): string => {
    switch (trend) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const renderMetricSelector = () => (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel>Metric</InputLabel>
      <Select
        value={selectedMetric}
        label="Metric"
        onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
      >
        <MenuItem value="users">Active Users</MenuItem>
        <MenuItem value="revenue">Revenue</MenuItem>
        <MenuItem value="tickets">Tickets Sold</MenuItem>
        <MenuItem value="listings">Active Listings</MenuItem>
      </Select>
    </FormControl>
  );

  const renderPeriodSelector = () => (
    <ToggleButtonGroup
      value={selectedPeriod}
      exclusive
      onChange={(_, value) => value && setSelectedPeriod(value)}
      size="small"
    >
      <ToggleButton value="day">1D</ToggleButton>
      <ToggleButton value="week">1W</ToggleButton>
      <ToggleButton value="month">1M</ToggleButton>
      <ToggleButton value="year">1Y</ToggleButton>
    </ToggleButtonGroup>
  );

  const renderSummaryCard = () => {
    if (!comparisonData) return null;

    const { summary } = comparisonData;
    const TrendIcon = summary.trend === 'up' ? GrowthIcon : summary.trend === 'down' ? DeclineIcon : NeutralIcon;
    const trendColor = getTrendColor(summary.trend);

    return (
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
                bgcolor: `${trendColor}20`,
                color: trendColor,
                mr: 2,
              }}
            >
              <TrendIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h6">Period Comparison</Typography>
              <Typography variant="body2" sx={{ color: trendColor }}>
                {comparisonData.change >= 0 ? '+' : ''}{comparisonData.change.toFixed(1)}% vs previous period
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Current</Typography>
              <Typography variant="h5">{formatValue(summary.current)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Previous</Typography>
              <Typography variant="h5">{formatValue(summary.previous)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderComparisonChart = () => {
    if (!comparisonData) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        const date = new Date(label);
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {date.toLocaleString()}
            </Typography>
            <Typography variant="body1" color="primary.main">
              Current: {formatValue(payload[0].value)}
            </Typography>
            <Typography variant="body1" color="secondary.main">
              Previous: {formatValue(payload[1].value)}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return selectedPeriod === 'day'
                  ? date.toLocaleTimeString()
                  : date.toLocaleDateString();
              }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              data={comparisonData.current}
              type="monotone"
              dataKey="value"
              name="Current Period"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              data={comparisonData.previous}
              type="monotone"
              dataKey="value"
              name="Previous Period"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {renderMetricSelector()}
              {renderPeriodSelector()}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {renderSummaryCard()}
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Period Comparison
            </Typography>
            {renderComparisonChart()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ComparisonAnalytics;
