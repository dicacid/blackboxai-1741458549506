import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
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
import analyticsService from '../../services/analyticsService';

interface TrendChartProps {
  className?: string;
  defaultMetric?: 'users' | 'purchases' | 'revenue';
  defaultPeriod?: 'hour' | 'day' | 'week' | 'month';
  title?: string;
  showControls?: boolean;
}

interface TrendData {
  timestamp: string;
  value: number;
  change: number;
}

const TrendChart: React.FC<TrendChartProps> = ({
  className,
  defaultMetric = 'users',
  defaultPeriod = 'day',
  title = 'Trend Analysis',
  showControls = true,
}) => {
  const theme = useTheme();
  const [metric, setMetric] = useState(defaultMetric);
  const [period, setPeriod] = useState(defaultPeriod);
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendData();
  }, [metric, period]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getActivityTrends(metric, period);
      setData(response);
    } catch (err) {
      setError('Failed to fetch trend data');
      console.error('Error fetching trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp: string): string => {
    const date = new Date(timestamp);
    switch (period) {
      case 'hour':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short' });
      default:
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatValue = (value: number): string => {
    if (metric === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  const getMetricLabel = (metricType: string): string => {
    switch (metricType) {
      case 'users':
        return 'Active Users';
      case 'purchases':
        return 'Purchases';
      case 'revenue':
        return 'Revenue';
      default:
        return metricType;
    }
  };

  const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }> = ({ active, payload, label }) => {
    if (active && payload && payload.length && label) {
      const currentValue = payload[0].value;
      const changeValue = data.find(d => d.timestamp === label)?.change || 0;

      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {new Date(label).toLocaleString()}
          </Typography>
          <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
            {getMetricLabel(metric)}: {formatValue(currentValue)}
          </Typography>
          <Typography
            variant="body2"
            color={changeValue >= 0 ? 'success.main' : 'error.main'}
          >
            {changeValue >= 0 ? '+' : ''}{changeValue.toFixed(1)}% from previous period
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
        <Typography variant="h6">{title}</Typography>
        {showControls && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={metric}
                label="Metric"
                onChange={(e) => setMetric(e.target.value as typeof metric)}
              >
                <MenuItem value="users">Users</MenuItem>
                <MenuItem value="purchases">Purchases</MenuItem>
                <MenuItem value="revenue">Revenue</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => setPeriod(e.target.value as typeof period)}
              >
                <MenuItem value="hour">Hourly</MenuItem>
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      <Box sx={{ height: 400, width: '100%' }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={formatValue}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name={getMetricLabel(metric)}
              stroke={theme.palette.primary.main}
              dot={false}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default TrendChart;
