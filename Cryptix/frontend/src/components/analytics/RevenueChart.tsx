import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RevenueStats } from '../../types';
import analyticsService from '../../services/analyticsService';
import eventService from '../../services/eventService';

interface RevenueChartProps {
  className?: string;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ChartType = 'bar' | 'pie';

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ className }) => {
  const theme = useTheme();
  const [period, setPeriod] = useState<TimePeriod>('monthly');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [data, setData] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getRevenueStats();
      setData(response);
    } catch (err) {
      setError('Failed to fetch revenue data');
      console.error('Error fetching revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBreakdownData = (): ChartDataPoint[] => {
    if (!data) return [];

    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
    ];

    return [
      {
        name: 'Primary Sales',
        value: data.breakdown.primarySales,
        color: colors[0],
      },
      {
        name: 'Secondary Sales',
        value: data.breakdown.secondarySales,
        color: colors[1],
      },
      {
        name: 'Subscriptions',
        value: data.breakdown.subscriptions,
        color: colors[2],
      },
      {
        name: 'Other',
        value: data.breakdown.other,
        color: colors[3],
      },
    ];
  };

  const getTrendData = (): ChartDataPoint[] => {
    if (!data) return [];

    const getValue = (period: TimePeriod): number => {
      switch (period) {
        case 'daily':
          return data.daily;
        case 'weekly':
          return data.weekly;
        case 'monthly':
          return data.monthly;
        case 'yearly':
          return data.yearly;
      }
    };

    return ['daily', 'weekly', 'monthly', 'yearly'].map((p) => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      value: getValue(p as TimePeriod),
      color: theme.palette.primary.main,
    }));
  };

  const formatValue = (value: number): string => {
    return eventService.formatPrice(value);
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
    }>;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {payload[0].name}
          </Typography>
          <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
            {formatValue(payload[0].value)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Alert severity="error" className={className}>
        {error}
      </Alert>
    );
  }

  if (loading) {
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
    <Paper className={className} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Revenue Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              label="Chart Type"
              onChange={(e) => setChartType(e.target.value as ChartType)}
            >
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_event: React.MouseEvent<HTMLElement>, value: TimePeriod | null) => 
              value && setPeriod(value)
            }
            size="small"
          >
            <ToggleButton value="daily">1D</ToggleButton>
            <ToggleButton value="weekly">1W</ToggleButton>
            <ToggleButton value="monthly">1M</ToggleButton>
            <ToggleButton value="yearly">1Y</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Revenue Breakdown
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer>
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={getBreakdownData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatValue(entry.value)}`}
                  >
                    {getBreakdownData().map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={getBreakdownData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill={theme.palette.primary.main}
                  >
                    {getBreakdownData().map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Revenue Trend
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatValue} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="value"
                  fill={theme.palette.primary.main}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RevenueChart;
