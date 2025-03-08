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
  useTheme,
} from '@mui/material';
import {
  FunnelChart,
  Funnel,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  ShoppingCart as CartIcon,
  Visibility as ViewsIcon,
  TouchApp as ClickIcon,
  LocalOffer as ConversionIcon,
} from '@mui/icons-material';
import type { EngagementMetrics, ChartTooltipProps } from '../../types';
import analyticsService from '../../services/analyticsService';

interface ConversionAnalyticsProps {
  className?: string;
}

interface FunnelData {
  value: number;
  name: string;
  fill: string;
}

interface ConversionTrend {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
  rate: number;
}

const ConversionAnalytics: React.FC<ConversionAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<ConversionTrend[]>([]);

  useEffect(() => {
    fetchConversionData();
  }, []);

  const fetchConversionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getEngagementMetrics('all', 'conversions', 'day');
      setMetrics(data);

      // Generate trend data
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const trends = dates.map(date => ({
        date,
        views: data.views.total * (0.9 + Math.random() * 0.2),
        clicks: data.clicks.total * (0.9 + Math.random() * 0.2),
        conversions: data.conversions.total * (0.9 + Math.random() * 0.2),
        rate: data.conversions.rate * (0.9 + Math.random() * 0.2),
      }));
      setTrendData(trends);
    } catch (err) {
      setError('Failed to fetch conversion data');
      console.error('Error fetching conversion data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Total Views',
        value: metrics.views.total,
        icon: <ViewsIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.primary.main,
        secondary: `${metrics.views.unique.toLocaleString()} unique`,
      },
      {
        title: 'Total Clicks',
        value: metrics.clicks.total,
        icon: <ClickIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.secondary.main,
        secondary: `${metrics.clicks.clickThroughRate.toFixed(1)}% CTR`,
      },
      {
        title: 'Conversions',
        value: metrics.conversions.total,
        icon: <CartIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.success.main,
        secondary: `${metrics.conversions.rate.toFixed(1)}% rate`,
      },
      {
        title: 'Avg Order Value',
        value: metrics.conversions.avgOrderValue,
        icon: <ConversionIcon sx={{ fontSize: 40 }} />,
        color: theme.palette.info.main,
        secondary: `$${metrics.conversions.value.toLocaleString()} total`,
      },
    ];

    return (
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
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
                    <Typography variant="body2" color="text.secondary">
                      {card.secondary}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4">
                  {card.title.includes('Value')
                    ? `$${card.value.toLocaleString()}`
                    : card.value.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderConversionFunnel = () => {
    if (!metrics) return null;

    const funnelData: FunnelData[] = [
      {
        value: metrics.views.total,
        name: 'Page Views',
        fill: theme.palette.primary.main,
      },
      {
        value: metrics.clicks.total,
        name: 'Interactions',
        fill: theme.palette.secondary.main,
      },
      {
        value: metrics.conversions.total,
        name: 'Purchases',
        fill: theme.palette.success.main,
      },
    ];

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {data.name}
            </Typography>
            <Typography variant="body1">
              {data.value.toLocaleString()} users
            </Typography>
            {payload[0].payload.rate && (
              <Typography variant="body2" color="success.main">
                {payload[0].payload.rate.toFixed(1)}% conversion rate
              </Typography>
            )}
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer>
          <FunnelChart>
            <Tooltip content={<CustomTooltip />} />
            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
            >
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderConversionTrend = () => {
    if (!trendData.length) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body1" color="primary.main">
              Views: {Number(payload[0].value).toLocaleString()}
            </Typography>
            <Typography variant="body1" color="secondary.main">
              Clicks: {Number(payload[1].value).toLocaleString()}
            </Typography>
            <Typography variant="body1" color="success.main">
              Conversions: {Number(payload[2].value).toLocaleString()}
            </Typography>
            <Typography variant="body1" color="info.main">
              Rate: {Number(payload[3].value).toFixed(1)}%
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
              dataKey="views"
              name="Views"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="conversions"
              name="Conversions"
              stroke={theme.palette.success.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              name="Conversion Rate"
              stroke={theme.palette.info.main}
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
        <Grid item xs={12}>
          {renderOverviewCards()}
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Conversion Funnel
            </Typography>
            {renderConversionFunnel()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Conversion Trends
            </Typography>
            {renderConversionTrend()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConversionAnalytics;
