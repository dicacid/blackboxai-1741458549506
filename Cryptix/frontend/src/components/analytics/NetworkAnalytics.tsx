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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Speed as SpeedIcon,
  CloudQueue as TrafficIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import type { ChartTooltipProps } from '../../types';

interface NetworkAnalyticsProps {
  className?: string;
}

interface NetworkMetrics {
  traffic: {
    inbound: number;
    outbound: number;
    total: number;
    history: Array<{
      timestamp: string;
      inbound: number;
      outbound: number;
    }>;
  };
  requests: {
    total: number;
    success: number;
    failed: number;
    avgResponseTime: number;
    distribution: Array<{
      endpoint: string;
      count: number;
      avgTime: number;
      errorRate: number;
    }>;
  };
  endpoints: {
    performance: Array<{
      path: string;
      requests: number;
      avgResponseTime: number;
      errorRate: number;
      p95ResponseTime: number;
    }>;
    errors: Array<{
      path: string;
      code: number;
      count: number;
      message: string;
    }>;
  };
  status: {
    uptime: number;
    lastDowntime: string | null;
    responseTime: number;
    availability: number;
  };
}

const NetworkAnalytics: React.FC<NetworkAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkData = async () => {
    try {
      setLoading(prevLoading => !metrics && prevLoading);
      // Simulated data - in a real app, this would be an API call
      const data: NetworkMetrics = {
        traffic: {
          inbound: 150 + Math.random() * 50,
          outbound: 100 + Math.random() * 30,
          total: 250 + Math.random() * 80,
          history: generateTrafficHistory(),
        },
        requests: {
          total: 10000 + Math.random() * 2000,
          success: 9800 + Math.random() * 100,
          failed: 100 + Math.random() * 50,
          avgResponseTime: 100 + Math.random() * 20,
          distribution: generateRequestDistribution(),
        },
        endpoints: {
          performance: generateEndpointPerformance(),
          errors: generateEndpointErrors(),
        },
        status: {
          uptime: 99.98,
          lastDowntime: null,
          responseTime: 95 + Math.random() * 10,
          availability: 99.99,
        },
      };
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch network data');
      console.error('Error fetching network data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTrafficHistory = () => {
    return Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (60 - i - 1));
      return {
        timestamp: date.toISOString(),
        inbound: 150 + Math.random() * 50,
        outbound: 100 + Math.random() * 30,
      };
    });
  };

  const generateRequestDistribution = () => {
    const endpoints = [
      '/api/events',
      '/api/tickets',
      '/api/users',
      '/api/analytics',
      '/api/blockchain',
    ];
    return endpoints.map(endpoint => ({
      endpoint,
      count: 1000 + Math.random() * 2000,
      avgTime: 80 + Math.random() * 40,
      errorRate: Math.random() * 2,
    }));
  };

  const generateEndpointPerformance = () => {
    const endpoints = [
      '/api/events/search',
      '/api/tickets/purchase',
      '/api/users/auth',
      '/api/analytics/metrics',
      '/api/blockchain/transactions',
    ];
    return endpoints.map(path => ({
      path,
      requests: 500 + Math.random() * 1000,
      avgResponseTime: 90 + Math.random() * 30,
      errorRate: Math.random() * 1,
      p95ResponseTime: 150 + Math.random() * 50,
    }));
  };

  const generateEndpointErrors = () => {
    const errors = [
      { code: 404, message: 'Not Found' },
      { code: 400, message: 'Bad Request' },
      { code: 401, message: 'Unauthorized' },
      { code: 500, message: 'Internal Server Error' },
      { code: 503, message: 'Service Unavailable' },
    ];
    return errors.map(err => ({
      path: '/api' + ['/events', '/tickets', '/users', '/analytics', '/blockchain'][Math.floor(Math.random() * 5)],
      code: err.code,
      count: Math.floor(Math.random() * 20),
      message: err.message,
    }));
  };

  const renderStatusCard = () => {
    if (!metrics) return null;

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
                bgcolor: metrics.status.availability > 99.9
                  ? `${theme.palette.success.main}20`
                  : `${theme.palette.warning.main}20`,
                color: metrics.status.availability > 99.9
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                mr: 2,
              }}
            >
              {metrics.status.availability > 99.9 ? <SuccessIcon sx={{ fontSize: 32 }} /> : <ErrorIcon sx={{ fontSize: 32 }} />}
            </Box>
            <Box>
              <Typography variant="h6">System Status</Typography>
              <Typography variant="body2" color="text.secondary">
                {metrics.status.availability}% Availability
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Uptime</Typography>
              <Typography variant="h6">{metrics.status.uptime}%</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Response Time</Typography>
              <Typography variant="h6">{metrics.status.responseTime.toFixed(0)}ms</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderTrafficChart = () => {
    if (!metrics) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(label).toLocaleTimeString()}
            </Typography>
            <Typography variant="body1" color="primary.main">
              Inbound: {payload[0].value.toFixed(1)} MB/s
            </Typography>
            <Typography variant="body1" color="secondary.main">
              Outbound: {payload[1].value.toFixed(1)} MB/s
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={metrics.traffic.history}>
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
              dataKey="inbound"
              name="Inbound Traffic"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="outbound"
              name="Outbound Traffic"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderEndpointPerformance = () => {
    if (!metrics) return null;

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Endpoint</TableCell>
              <TableCell align="right">Requests</TableCell>
              <TableCell align="right">Avg Time</TableCell>
              <TableCell align="right">P95 Time</TableCell>
              <TableCell align="right">Error Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.endpoints.performance.map((endpoint) => (
              <TableRow key={endpoint.path}>
                <TableCell>{endpoint.path}</TableCell>
                <TableCell align="right">{endpoint.requests.toLocaleString()}</TableCell>
                <TableCell align="right">{endpoint.avgResponseTime.toFixed(0)}ms</TableCell>
                <TableCell align="right">{endpoint.p95ResponseTime.toFixed(0)}ms</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${endpoint.errorRate.toFixed(1)}%`}
                    color={endpoint.errorRate < 1 ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
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
          {renderStatusCard()}
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Network Traffic
            </Typography>
            {renderTrafficChart()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Endpoint Performance
            </Typography>
            {renderEndpointPerformance()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NetworkAnalytics;
