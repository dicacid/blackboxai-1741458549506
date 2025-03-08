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
  CardActionArea,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as UsersIcon,
  AttachMoney as RevenueIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
  AccountBalance as BlockchainIcon,
  LocalOffer as MarketIcon,
  Recommend as RecommendIcon,
  Error as ErrorIcon,
  CloudQueue as NetworkIcon,
  Compare as ComparisonIcon,
  GetApp as ExportIcon,
  Settings as PreferencesIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { AnalyticsMetrics } from '../../types';
import analyticsService from '../../services/analyticsService';

interface AnalyticsOverviewProps {
  className?: string;
  onRefresh?: () => void;
}

interface MetricData {
  primaryValue: number;
  secondaryValue: number;
  change: number;
  isPercentage?: boolean;
}

interface AnalyticsSummary {
  users: MetricData;
  revenue: MetricData;
  performance: MetricData & { isPercentage: true };
  security: MetricData & { isPercentage: true };
  blockchain: MetricData;
  market: MetricData;
  recommendations: MetricData & { isPercentage: true };
  errors: MetricData;
  network: MetricData & { isPercentage: true };
}

const ANALYTICS_SECTIONS = [
  {
    id: 'users',
    title: 'User Analytics',
    icon: UsersIcon,
    color: '#3f51b5',
    route: '/analytics/users',
  },
  {
    id: 'revenue',
    title: 'Revenue Analytics',
    icon: RevenueIcon,
    color: '#2196f3',
    route: '/analytics/revenue',
  },
  {
    id: 'performance',
    title: 'Performance Analytics',
    icon: PerformanceIcon,
    color: '#00bcd4',
    route: '/analytics/performance',
  },
  {
    id: 'security',
    title: 'Security Analytics',
    icon: SecurityIcon,
    color: '#f44336',
    route: '/analytics/security',
  },
  {
    id: 'blockchain',
    title: 'Blockchain Analytics',
    icon: BlockchainIcon,
    color: '#9c27b0',
    route: '/analytics/blockchain',
  },
  {
    id: 'market',
    title: 'Market Analytics',
    icon: MarketIcon,
    color: '#4caf50',
    route: '/analytics/market',
  },
  {
    id: 'recommendations',
    title: 'Recommendation Analytics',
    icon: RecommendIcon,
    color: '#ff9800',
    route: '/analytics/recommendations',
  },
  {
    id: 'errors',
    title: 'Error Analytics',
    icon: ErrorIcon,
    color: '#f44336',
    route: '/analytics/errors',
  },
  {
    id: 'network',
    title: 'Network Analytics',
    icon: NetworkIcon,
    color: '#607d8b',
    route: '/analytics/network',
  },
] as const;

const UTILITY_SECTIONS = [
  {
    id: 'comparison',
    title: 'Compare Analytics',
    icon: ComparisonIcon,
    color: '#795548',
    route: '/analytics/compare',
  },
  {
    id: 'export',
    title: 'Export Analytics',
    icon: ExportIcon,
    color: '#009688',
    route: '/analytics/export',
  },
  {
    id: 'preferences',
    title: 'Analytics Preferences',
    icon: PreferencesIcon,
    color: '#673ab7',
    route: '/analytics/preferences',
  },
] as const;

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ className, onRefresh }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalyticsSummary();
  }, []);

  const fetchAnalyticsSummary = async () => {
    try {
      setLoading(prevLoading => !summary && prevLoading);
      // Simulated data - in a real app, this would be an API call
      const data: AnalyticsSummary = {
        users: {
          primaryValue: 10000,
          secondaryValue: 5000,
          change: 5.2,
        },
        revenue: {
          primaryValue: 500000,
          secondaryValue: 25000,
          change: 8.5,
        },
        performance: {
          primaryValue: 95,
          secondaryValue: 85,
          change: 2.1,
          isPercentage: true,
        },
        security: {
          primaryValue: 98,
          secondaryValue: 5,
          change: -1.2,
          isPercentage: true,
        },
        blockchain: {
          primaryValue: 25000,
          secondaryValue: 1500,
          change: 12.3,
        },
        market: {
          primaryValue: 1200,
          secondaryValue: 50000,
          change: 15.7,
        },
        recommendations: {
          primaryValue: 92,
          secondaryValue: 85,
          change: 3.4,
          isPercentage: true,
        },
        errors: {
          primaryValue: 25,
          secondaryValue: 3,
          change: -45.2,
        },
        network: {
          primaryValue: 99.99,
          secondaryValue: 15000,
          change: 0.01,
          isPercentage: true,
        },
      };
      setSummary(data);
      setLastUpdated(new Date());
      onRefresh?.();
    } catch (err) {
      setError('Failed to fetch analytics summary');
      console.error('Error fetching analytics summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsSummary();
  };

  const renderSectionCard = (section: typeof ANALYTICS_SECTIONS[number]) => {
    if (!summary) return null;

    const data = summary[section.id as keyof AnalyticsSummary];
    const Icon = section.icon;

    return (
      <Card>
        <CardActionArea onClick={() => navigate(section.route)}>
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
                  bgcolor: `${section.color}20`,
                  color: section.color,
                  mr: 2,
                }}
              >
                <Icon sx={{ fontSize: 32 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{section.title}</Typography>
                <Typography
                  variant="body2"
                  color={data.change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <TrendingUpIcon
                    sx={{
                      mr: 0.5,
                      transform: data.change >= 0 ? 'none' : 'rotate(180deg)',
                    }}
                  />
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h4">
              {data.primaryValue > 100
                ? data.primaryValue.toLocaleString()
                : data.primaryValue.toFixed(1) + (data.isPercentage ? '%' : '')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.secondaryValue > 100
                ? data.secondaryValue.toLocaleString()
                : data.secondaryValue.toFixed(1) + (data.isPercentage ? '%' : '')}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  const renderUtilityCard = (section: typeof UTILITY_SECTIONS[number]) => {
    const Icon = section.icon;

    return (
      <Card>
        <CardActionArea onClick={() => navigate(section.route)}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: `${section.color}20`,
                  color: section.color,
                  mr: 2,
                }}
              >
                <Icon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6">{section.title}</Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  if (error) {
    return (
      <Alert severity="error" className={className}>
        {error}
      </Alert>
    );
  }

  if (loading || !summary) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Analytics Overview</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastUpdated && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {ANALYTICS_SECTIONS.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.id}>
            {renderSectionCard(section)}
          </Grid>
        ))}

        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
        </Grid>

        {UTILITY_SECTIONS.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.id}>
            {renderUtilityCard(section)}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AnalyticsOverview;
