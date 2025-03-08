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
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
} from 'recharts';
import type { ActivityMetrics } from '../../types';
import analyticsService from '../../services/analyticsService';

interface BehavioralAnalyticsProps {
  className?: string;
}

const BehavioralAnalytics: React.FC<BehavioralAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBehavioralData();
  }, []);

  const fetchBehavioralData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getUserActivityMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch behavioral data');
      console.error('Error fetching behavioral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchTermsTable = () => {
    if (!metrics?.behavioralMetrics.searchTerms) return null;

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Search Term</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">Conversion Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.behavioralMetrics.searchTerms.map((term) => (
              <TableRow key={term.term}>
                <TableCell>{term.term}</TableCell>
                <TableCell align="right">{term.count}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${term.conversionRate}%`}
                    color={term.conversionRate > 5 ? 'success' : 'default'}
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

  const renderClickPatterns = () => {
    if (!metrics?.behavioralMetrics.clickPatterns) return null;

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={metrics.behavioralMetrics.clickPatterns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="element" />
            <YAxis />
            <Bar
              dataKey="clicks"
              fill={theme.palette.primary.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderUserPaths = () => {
    if (!metrics?.behavioralMetrics.userPaths) return null;

    const maxFrequency = Math.max(
      ...metrics.behavioralMetrics.userPaths.map(path => path.frequency)
    );

    return (
      <Grid container spacing={1}>
        {metrics.behavioralMetrics.userPaths.map((path, index) => {
          const opacity = 0.3 + (path.frequency / maxFrequency) * 0.7;
          return (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2">Path: {path.path.join(' → ')}</Typography>
                    <Typography variant="body2">Frequency: {path.frequency}</Typography>
                    <Typography variant="body2">
                      Avg Time: {path.avgTimeSpent.toFixed(1)}s
                    </Typography>
                  </Box>
                }
              >
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.primary.main,
                    opacity,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      opacity: 1,
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {path.path[0]} → {path.path[path.path.length - 1]}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    {path.frequency}
                  </Typography>
                </Paper>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderEngagementScatter = () => {
    if (!metrics?.behavioralMetrics.userPaths) return null;

    const data = metrics.behavioralMetrics.userPaths.map((path) => ({
      frequency: path.frequency,
      timeSpent: path.avgTimeSpent,
      name: path.path[0],
    }));

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="frequency"
              name="Frequency"
              type="number"
              label={{ value: 'Frequency', position: 'bottom' }}
            />
            <YAxis
              dataKey="timeSpent"
              name="Time Spent (s)"
              type="number"
              label={{ value: 'Time Spent (s)', angle: -90, position: 'left' }}
            />
            <Scatter
              data={data}
              fill={theme.palette.primary.main}
            />
          </ScatterChart>
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
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Popular Search Terms
            </Typography>
            {renderSearchTermsTable()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Click Patterns
            </Typography>
            {renderClickPatterns()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Journey Distribution
            </Typography>
            {renderUserPaths()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Engagement Analysis
            </Typography>
            {renderEngagementScatter()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BehavioralAnalytics;
