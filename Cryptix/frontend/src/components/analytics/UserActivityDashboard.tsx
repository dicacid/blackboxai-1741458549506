import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
} from '@mui/material';
import type { ActivityMetrics } from '../../types';
import analyticsService from '../../services/analyticsService';

interface UserActivityDashboardProps {
  className?: string;
}

const UserActivityDashboard: React.FC<UserActivityDashboardProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getUserActivityMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch user activity data');
      console.error('Error fetching user activity data:', err);
    } finally {
      setLoading(false);
    }
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
        {/* User Segments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Segments
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(metrics.userSegments).map(([segment, count]) => (
                <Grid item xs={6} key={segment}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {segment.charAt(0).toUpperCase() + segment.slice(1)}
                    </Typography>
                    <Typography variant="h6">{count}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Device Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Usage
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(metrics.deviceStats).map(([device, count]) => (
                <Grid item xs={4} key={device}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {device.charAt(0).toUpperCase() + device.slice(1)}
                    </Typography>
                    <Typography variant="h6">{count}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Time Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Activity Distribution
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(metrics.timeDistribution).map(([time, value]) => (
                <Grid item xs={6} key={time}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </Typography>
                    <Typography variant="h6">{value}%</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Engagement Scores */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Engagement Scores
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Overall Score
              </Typography>
              <Typography variant="h4" color="primary">
                {metrics.engagementScores.overall}%
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {Object.entries(metrics.engagementScores.byFeature).map(([feature, score]) => (
                <Grid item xs={6} key={feature}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {feature.charAt(0).toUpperCase() + feature.slice(1)}
                    </Typography>
                    <Typography variant="h6">{score}%</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserActivityDashboard;
