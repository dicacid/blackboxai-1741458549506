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
  useTheme,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { EngagementMetrics } from '../../types';
import analyticsService from '../../services/analyticsService';

interface EngagementChartProps {
  eventId: string;
  className?: string;
}

type TimePeriod = 'hour' | 'day' | 'week' | 'month';
type MetricType = 'views' | 'clicks' | 'conversions';

interface ChartDataPoint {
  timestamp: string;
  value: number;
  label: string;
}

const EngagementChart: React.FC<EngagementChartProps> = ({ eventId, className }) => {
  const theme = useTheme();
  const [period, setPeriod] = useState<TimePeriod>('day');
  const [metric, setMetric] = useState<MetricType>('views');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEngagementData();
  }, [eventId, period, metric]);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getEngagementMetrics(eventId, metric, period);
      
      const chartData: ChartDataPoint[] = response.labels.map((label, index) => ({
        timestamp: label,
        value: response.values[index],
        label,
      }));
      
      setData(chartData);
    } catch (err) {
      setError('Failed to fetch engagement data');
      console.error('Error fetching engagement data:', err);
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

  const getMetricLabel = (type: MetricType): string => {
    switch (type) {
      case 'views':
        return 'Page Views';
      case 'clicks':
        return 'Interactions';
      case 'conversions':
        return 'Purchases';
      default:
        return type;
    }
  };

  const getGradientId = (): string => `engagement-gradient-${metric}`;

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      dataKey: string;
    }>;
    label?: string;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {new Date(label || '').toLocaleString()}
          </Typography>
          <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
            {getMetricLabel(metric)}: {payload[0].value}
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
        <Typography variant="h6">Engagement Metrics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={metric}
              label="Metric"
              onChange={(e) => setMetric(e.target.value as MetricType)}
            >
              <MenuItem value="views">Views</MenuItem>
              <MenuItem value="clicks">Clicks</MenuItem>
              <MenuItem value="conversions">Conversions</MenuItem>
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
            <ToggleButton value="hour">1H</ToggleButton>
            <ToggleButton value="day">24H</ToggleButton>
            <ToggleButton value="week">7D</ToggleButton>
            <ToggleButton value="month">30D</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ height: 400, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              minTickGap={30}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              name={getMetricLabel(metric)}
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill={`url(#${getGradientId()})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default EngagementChart;
