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
  TrendingUp as RetentionIcon,
  TrendingDown as ChurnIcon,
  People as UsersIcon,
} from '@mui/icons-material';
import type { AnalyticsMetrics, ChartTooltipProps } from '../../types';
import analyticsService from '../../services/analyticsService';

interface RetentionAnalyticsProps {
  className?: string;
}

interface RetentionTrendData {
  date: string;
  retention: number;
  churn: number;
  users: number;
}

interface CohortData {
  week: string;
  retention: number;
  users: number;
}

const RetentionAnalytics: React.FC<RetentionAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<RetentionTrendData[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);

  useEffect(() => {
    fetchRetentionData();
  }, []);

  const fetchRetentionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAnalyticsMetrics();
      setMetrics(data);

      // Generate trend data
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const trendData = dates.map(date => ({
        date,
        retention: data.userStats.retentionRate + (Math.random() * 2 - 1),
        churn: data.userStats.churnRate + (Math.random() * 2 - 1),
        users: data.userStats.activeUsers * (0.9 + Math.random() * 0.2),
      }));
      setTrendData(trendData);

      // Generate cohort data
      const cohortData = Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i + 1}`,
        retention: Math.max(0, data.userStats.retentionRate * (1 - i * 0.1)),
        users: data.userStats.activeUsers * (1 - i * 0.08),
      }));
      setCohortData(cohortData);
    } catch (err) {
      setError('Failed to fetch retention data');
      console.error('Error fetching retention data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Retention Rate',
        value: metrics.userStats.retentionRate,
        change: metrics.userStats.percentageChange.retention,
        icon: <RetentionIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.success.main,
        format: (value: number) => `${value.toFixed(1)}%`,
      },
      {
        title: 'Churn Rate',
        value: metrics.userStats.churnRate,
        change: -metrics.userStats.percentageChange.retention,
        icon: <ChurnIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.error.main,
        format: (value: number) => `${value.toFixed(1)}%`,
      },
      {
        title: 'Active Users',
        value: metrics.userStats.activeUsers,
        change: metrics.userStats.percentageChange.active,
        icon: <UsersIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.primary.main,
        format: (value: number) => value.toLocaleString(),
      },
    ];

    return (
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
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
                      bgcolor: `${card.color}20`,
                      color: card.color,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6">{card.title}</Typography>
                    <Typography
                      variant="body2"
                      color={card.change >= 0 ? 'success.main' : 'error.main'}
                    >
                      {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}% from last period
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4">
                  {card.format(card.value)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={card.title === 'Churn Rate' ? 100 - card.value : card.value}
                  sx={{
                    mt: 2,
                    height: 8,
                    borderRadius: 1,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: card.color,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderRetentionTrend = () => {
    if (!metrics || !trendData.length) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body1" color="success.main">
              Retention: {Number(payload[0].value).toFixed(1)}%
            </Typography>
            <Typography variant="body1" color="error.main">
              Churn: {Number(payload[1].value).toFixed(1)}%
            </Typography>
            <Typography variant="body1" color="primary.main">
              Users: {Number(payload[2].value).toLocaleString()}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="retention"
              name="Retention Rate"
              stroke={theme.palette.success.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="churn"
              name="Churn Rate"
              stroke={theme.palette.error.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="users"
              name="Active Users"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderCohortAnalysis = () => {
    if (!metrics || !cohortData.length) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body1" color="primary">
              Retention: {Number(payload[0].value).toFixed(1)}%
            </Typography>
            <Typography variant="body1">
              Users: {Number(payload[1].value).toLocaleString()}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={cohortData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="retention"
              name="Cohort Retention"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="users"
              name="Active Users"
              stroke={theme.palette.secondary.main}
              fill={theme.palette.secondary.main}
              fillOpacity={0.2}
            />
          </AreaChart>
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
          {renderOverviewCards()}
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Retention Trends
            </Typography>
            {renderRetentionTrend()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cohort Analysis
            </Typography>
            {renderCohortAnalysis()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RetentionAnalytics;
