import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import type { AnalyticsMetrics } from '../types';
import MarketplaceStats from '../components/marketplace/MarketplaceStats';
import FraudDetectionDashboard from '../components/analytics/FraudDetectionDashboard';
import UserActivityDashboard from '../components/analytics/UserActivityDashboard';
import RevenueChart from '../components/analytics/RevenueChart';
import PriceChart from '../components/analytics/PriceChart';
import HeatmapChart from '../components/analytics/HeatmapChart';
import EngagementChart from '../components/analytics/EngagementChart';
import analyticsService from '../services/analyticsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`dashboard-tabpanel-${index}`}
    aria-labelledby={`dashboard-tab-${index}`}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data
      const [metricsData] = await Promise.all([
        analyticsService.getAnalyticsMetrics(),
      ]);

      setMetrics(metricsData);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Market Overview',
        icon: <TrendingUpIcon />,
        stats: [
          { label: 'Trading Volume', value: metrics.marketStats.tradingVolume },
          { label: 'Active Listings', value: metrics.marketStats.activeListings },
          { label: 'Avg Price', value: metrics.marketStats.avgResalePrice },
        ],
        color: theme.palette.primary.main,
      },
      {
        title: 'Security',
        icon: <SecurityIcon />,
        stats: [
          { label: 'Active Alerts', value: metrics.fraudStats.activeAlerts },
          { label: 'Risk Score', value: metrics.fraudStats.riskScore },
          { label: 'Suspicious Activities', value: metrics.fraudStats.suspiciousActivities },
        ],
        color: theme.palette.error.main,
      },
      {
        title: 'User Activity',
        icon: <PeopleIcon />,
        stats: [
          { label: 'Active Users', value: metrics.userStats.activeUsers },
          { label: 'Retention Rate', value: `${metrics.userStats.retentionRate}%` },
          { label: 'Avg Session', value: `${Math.round(metrics.userStats.avgSessionDuration / 60)}m` },
        ],
        color: theme.palette.success.main,
      },
      {
        title: 'Events',
        icon: <EventIcon />,
        stats: [
          { label: 'Active Events', value: metrics.eventStats.activeEvents },
          { label: 'Tickets Sold', value: metrics.eventStats.ticketsSold },
          { label: 'Revenue', value: metrics.eventStats.totalRevenue },
        ],
        color: theme.palette.info.main,
      },
    ];

    return (
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: `${card.color}20`,
                    color: card.color,
                    mr: 2,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6">{card.title}</Typography>
              </Box>

              {card.stats.map((stat, i) => (
                <Box key={i} sx={{ mb: i < card.stats.length - 1 ? 1 : 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h6">{stat.value}</Typography>
                </Box>
              ))}

              <Box
                sx={{
                  position: 'absolute',
                  right: -20,
                  bottom: -20,
                  opacity: 0.1,
                  transform: 'rotate(-15deg)',
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {renderOverviewCards()}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          aria-label="dashboard tabs"
        >
          <Tab label="Market Analytics" />
          <Tab label="Security" />
          <Tab label="User Activity" />
          <Tab label="Revenue" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MarketplaceStats stats={metrics?.marketStats} />
          </Grid>
          <Grid item xs={12} md={8}>
            <PriceChart eventId={selectedEventId} />
          </Grid>
          <Grid item xs={12} md={4}>
            <HeatmapChart eventId={selectedEventId} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <FraudDetectionDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <UserActivityDashboard />
          </Grid>
          <Grid item xs={12}>
            <EngagementChart eventId={selectedEventId} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <RevenueChart />
      </TabPanel>
    </Container>
  );
};

export default Dashboard;
