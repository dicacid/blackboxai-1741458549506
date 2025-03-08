import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { ActivityMetrics } from '../../types';
import analyticsService from '../../services/analyticsService';

interface GeographicDistributionProps {
  className?: string;
}

const GeographicDistribution: React.FC<GeographicDistributionProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGeographicData();
  }, []);

  const fetchGeographicData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getUserActivityMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch geographic data');
      console.error('Error fetching geographic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDistributionTable = () => {
    if (!metrics?.geographicData) return null;

    const sortedData = [...metrics.geographicData].sort((a, b) => b.users - a.users);

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell align="right">Users</TableCell>
              <TableCell>Distribution</TableCell>
              <TableCell align="right">Change</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow key={item.country}>
                <TableCell>{item.country}</TableCell>
                <TableCell align="right">{item.users.toLocaleString()}</TableCell>
                <TableCell sx={{ width: '30%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress
                      variant="determinate"
                      value={item.percentage}
                      sx={{
                        width: '100%',
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.primary.main,
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1, minWidth: 45 }}>
                      {item.percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={item.change >= 0 ? 'success.main' : 'error.main'}
                  >
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderPieChart = () => {
    if (!metrics?.geographicData) return null;

    const COLORS = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.grey[500],
    ];

    const data = metrics.geographicData
      .sort((a, b) => b.users - a.users)
      .slice(0, 5)
      .map((item, index) => ({
        name: item.country,
        value: item.users,
        color: COLORS[index % COLORS.length],
      }));

    // Add "Others" category if there are more countries
    if (metrics.geographicData.length > 5) {
      const othersValue = metrics.geographicData
        .slice(5)
        .reduce((sum, item) => sum + item.users, 0);
      
      data.push({
        name: 'Others',
        value: othersValue,
        color: COLORS[5],
      });
    }

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => `${entry.name} (${((entry.value / metrics.geographicData.reduce((sum, item) => sum + item.users, 0)) * 100).toFixed(1)}%)`}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {data.name}
                      </Typography>
                      <Typography variant="body1" color="primary">
                        {data.value.toLocaleString()} users
                      </Typography>
                    </Paper>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderTrendChart = () => {
    if (!metrics?.geographicData) return null;

    const top5Countries = metrics.geographicData
      .sort((a, b) => b.users - a.users)
      .slice(0, 5)
      .map(item => item.country);

    const data = top5Countries.map(country => {
      const countryData = metrics.geographicData.find(item => item.country === country);
      return {
        name: country,
        users: countryData?.users || 0,
        change: countryData?.change || 0,
      };
    });

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="body1">
                        Users: {payload[0].value.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={payload[1].value >= 0 ? 'success.main' : 'error.main'}
                      >
                        Change: {payload[1].value >= 0 ? '+' : ''}{payload[1].value}%
                      </Typography>
                    </Paper>
                  );
                }
                return null;
              }}
            />
            <Bar yAxisId="left" dataKey="users" fill={theme.palette.primary.main} />
            <Bar yAxisId="right" dataKey="change" fill={theme.palette.secondary.main} />
          </BarChart>
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
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Geographic Distribution
            </Typography>
            {renderDistributionTable()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribution Overview
            </Typography>
            {renderPieChart()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Countries Trend
            </Typography>
            {renderTrendChart()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeographicDistribution;
