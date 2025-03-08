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
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Memory as CPUIcon,
  Storage as MemoryIcon,
  Speed as LatencyIcon,
  CloudQueue as NetworkIcon,
} from '@mui/icons-material';
import type { ChartTooltipProps, TimeSeriesData } from '../../types';

interface PerformanceAnalyticsProps {
  className?: string;
}

interface PerformanceMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    history: TimeSeriesData[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    history: TimeSeriesData[];
  };
  network: {
    bandwidth: number;
    latency: number;
    requests: number;
    errors: number;
    history: TimeSeriesData[];
  };
  latency: {
    api: number;
    database: number;
    blockchain: number;
    history: TimeSeriesData[];
  };
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(prevLoading => !metrics && prevLoading);
      // Simulated data - in a real app, this would be an API call
      const data: PerformanceMetrics = {
        cpu: {
          usage: 45 + Math.random() * 20,
          cores: 8,
          temperature: 50 + Math.random() * 10,
          history: generateTimeSeriesData(60, 45, 20),
        },
        memory: {
          total: 16384,
          used: 8192 + Math.random() * 2048,
          free: 6144 - Math.random() * 2048,
          history: generateTimeSeriesData(60, 70, 15),
        },
        network: {
          bandwidth: 100 + Math.random() * 50,
          latency: 50 + Math.random() * 20,
          requests: 1000 + Math.random() * 200,
          errors: Math.random() * 10,
          history: generateTimeSeriesData(60, 80, 30),
        },
        latency: {
          api: 100 + Math.random() * 50,
          database: 20 + Math.random() * 10,
          blockchain: 200 + Math.random() * 100,
          history: generateTimeSeriesData(60, 150, 50),
        },
      };
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (
    points: number,
    baseValue: number,
    variance: number
  ): TimeSeriesData[] => {
    return Array.from({ length: points }, (_, i) => {
      const date = new Date();
      date.setSeconds(date.getSeconds() - (points - i - 1));
      return {
        timestamp: date.toISOString(),
        value: baseValue + (Math.random() * variance * 2 - variance),
      };
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const renderMetricCard = (
    title: string,
    value: number,
    max: number,
    unit: string,
    icon: React.ReactNode,
    color: string
  ) => (
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
              bgcolor: `${color}20`,
              color,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {value.toFixed(1)}{unit} / {max}{unit}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(value / max) * 100}
          sx={{
            height: 8,
            borderRadius: 1,
            bgcolor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
            },
          }}
        />
      </CardContent>
    </Card>
  );

  const renderUsageChart = () => {
    if (!metrics) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(label).toLocaleTimeString()}
            </Typography>
            <Typography variant="body1" color="primary.main">
              CPU: {payload[0].value.toFixed(1)}%
            </Typography>
            <Typography variant="body1" color="secondary.main">
              Memory: {payload[1].value.toFixed(1)}%
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <AreaChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              data={metrics.cpu.history}
              dataKey="value"
              name="CPU Usage"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              data={metrics.memory.history}
              dataKey="value"
              name="Memory Usage"
              stroke={theme.palette.secondary.main}
              fill={theme.palette.secondary.main}
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderLatencyChart = () => {
    if (!metrics) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(label).toLocaleTimeString()}
            </Typography>
            <Typography variant="body1" color="primary.main">
              API: {payload[0].value.toFixed(1)}ms
            </Typography>
            <Typography variant="body1" color="secondary.main">
              Database: {payload[1].value.toFixed(1)}ms
            </Typography>
            <Typography variant="body1" color="success.main">
              Blockchain: {payload[2].value.toFixed(1)}ms
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              data={metrics.latency.history}
              dataKey="value"
              name="API Latency"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              data={metrics.latency.history.map(d => ({ ...d, value: d.value * 0.2 }))}
              dataKey="value"
              name="Database Latency"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              data={metrics.latency.history.map(d => ({ ...d, value: d.value * 2 }))}
              dataKey="value"
              name="Blockchain Latency"
              stroke={theme.palette.success.main}
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
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'CPU Usage',
            metrics.cpu.usage,
            100,
            '%',
            <CPUIcon sx={{ fontSize: 32 }} />,
            theme.palette.primary.main
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Memory Usage',
            (metrics.memory.used / metrics.memory.total) * 100,
            100,
            '%',
            <MemoryIcon sx={{ fontSize: 32 }} />,
            theme.palette.secondary.main
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Network',
            metrics.network.bandwidth,
            150,
            'Mbps',
            <NetworkIcon sx={{ fontSize: 32 }} />,
            theme.palette.success.main
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Avg Latency',
            metrics.network.latency,
            200,
            'ms',
            <LatencyIcon sx={{ fontSize: 32 }} />,
            theme.palette.info.main
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resource Usage
            </Typography>
            {renderUsageChart()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Latency Analysis
            </Typography>
            {renderLatencyChart()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceAnalytics;
