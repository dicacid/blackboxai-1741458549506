import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
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
import type { PriceHistory } from '../../types';
import analyticsService from '../../services/analyticsService';
import eventService from '../../services/eventService';

interface PriceChartProps {
  eventId: string;
  className?: string;
}

type TimePeriod = 'day' | 'week' | 'month' | 'all';

interface ChartDataPoint {
  timestamp: string;
  price: number;
  volume: number;
  formattedPrice: string;
  formattedVolume: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ eventId, className }) => {
  const theme = useTheme();
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPriceHistory();
  }, [eventId, period]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getPriceHistory(eventId, period);
      
      // Transform the data to include formatted values
      const chartData: ChartDataPoint[] = response.timestamps.map((timestamp: string, index: number) => ({
        timestamp,
        price: response.prices[index],
        volume: response.volumes[index],
        formattedPrice: eventService.formatPrice(response.prices[index]),
        formattedVolume: response.volumes[index].toString(),
      }));
      
      setData(chartData);
    } catch (err) {
      setError('Failed to fetch price history');
      console.error('Error fetching price history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp: string): string => {
    const date = new Date(timestamp);
    switch (period) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short' });
      case 'month':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
    }
  };

  const formatTooltip = (value: number): string => {
    return eventService.formatPrice(value);
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      dataKey: string;
    }>;
    label?: string;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length && label) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {new Date(label).toLocaleString()}
          </Typography>
          <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
            Price: {eventService.formatPrice(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Volume: {payload[1].value} tickets
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
        <Typography variant="h6">Price History</Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_event: React.MouseEvent<HTMLElement>, value: TimePeriod | null) => 
            value && setPeriod(value)
          }
          size="small"
        >
          <ToggleButton value="day">24H</ToggleButton>
          <ToggleButton value="week">1W</ToggleButton>
          <ToggleButton value="month">1M</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
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
              yAxisId="left"
              tickFormatter={formatTooltip}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value: number) => value.toString()}
              domain={[0, 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="price"
              name="Price"
              stroke={theme.palette.primary.main}
              dot={false}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              name="Volume"
              stroke={theme.palette.secondary.main}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default PriceChart;
