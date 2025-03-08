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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Recommend as RecommendIcon,
  TrendingUp as AccuracyIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import type { ChartTooltipProps } from '../../types';

interface RecommendationAnalyticsProps {
  className?: string;
}

interface RecommendationMetrics {
  overview: {
    accuracy: number;
    coverage: number;
    diversity: number;
    relevance: number;
    clickThroughRate: number;
    conversionRate: number;
  };
  performance: {
    history: Array<{
      timestamp: string;
      accuracy: number;
      coverage: number;
      diversity: number;
    }>;
    byCategory: Array<{
      category: string;
      accuracy: number;
      coverage: number;
      recommendations: number;
      conversions: number;
    }>;
  };
  userPreferences: {
    categories: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
    features: Array<{
      name: string;
      importance: number;
      reliability: number;
    }>;
  };
  recommendations: Array<{
    id: string;
    eventName: string;
    category: string;
    confidence: number;
    relevanceScore: number;
    clickRate: number;
    conversionRate: number;
    impressions: number;
  }>;
}

interface MetricColors {
  accuracy: string;
  coverage: string;
  diversity: string;
}

const RecommendationAnalytics: React.FC<RecommendationAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<RecommendationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const metricColors: MetricColors = {
    accuracy: theme.palette.primary.main,
    coverage: theme.palette.secondary.main,
    diversity: theme.palette.success.main,
  };

  const fetchRecommendationData = async () => {
    try {
      setLoading(prevLoading => !metrics && prevLoading);
      // Simulated data - in a real app, this would be an API call
      const data: RecommendationMetrics = {
        overview: {
          accuracy: 85 + Math.random() * 10,
          coverage: 75 + Math.random() * 15,
          diversity: 70 + Math.random() * 20,
          relevance: 80 + Math.random() * 15,
          clickThroughRate: 25 + Math.random() * 10,
          conversionRate: 15 + Math.random() * 5,
        },
        performance: {
          history: generatePerformanceHistory(),
          byCategory: generateCategoryPerformance(),
        },
        userPreferences: {
          categories: generateCategoryPreferences(),
          features: generateFeatureImportance(),
        },
        recommendations: generateRecommendations(),
      };
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch recommendation data');
      console.error('Error fetching recommendation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendationData();
    const interval = setInterval(fetchRecommendationData, 30000);
    return () => clearInterval(interval);
  }, []);

  const generatePerformanceHistory = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (24 - i - 1));
      return {
        timestamp: date.toISOString(),
        accuracy: 80 + Math.sin(i / 4) * 10 + Math.random() * 5,
        coverage: 70 + Math.cos(i / 6) * 15 + Math.random() * 5,
        diversity: 65 + Math.sin(i / 8) * 20 + Math.random() * 5,
      };
    });
  };

  const generateCategoryPerformance = () => {
    const categories = [
      'Music',
      'Sports',
      'Theater',
      'Comedy',
      'Conference',
    ];
    
    return categories.map(category => ({
      category,
      accuracy: 75 + Math.random() * 20,
      coverage: 65 + Math.random() * 25,
      recommendations: 1000 + Math.random() * 500,
      conversions: 100 + Math.random() * 100,
    }));
  };

  const generateCategoryPreferences = () => {
    const categories = [
      'Music',
      'Sports',
      'Theater',
      'Comedy',
      'Conference',
    ];
    
    const total = 100;
    return categories.map((name, index) => {
      const percentage = 35 - index * 5 + Math.random() * 5;
      return {
        name,
        count: Math.floor((percentage / 100) * 1000),
        percentage,
      };
    });
  };

  const generateFeatureImportance = () => {
    const features = [
      'Price',
      'Location',
      'Date',
      'Category',
      'Artist',
      'Venue',
    ];
    
    return features.map(name => ({
      name,
      importance: 50 + Math.random() * 50,
      reliability: 60 + Math.random() * 40,
    }));
  };

  const generateRecommendations = () => {
    const events = [
      'Summer Music Festival',
      'Tech Conference 2024',
      'Sports Championship',
      'Art Exhibition',
      'Comedy Night',
    ];
    
    return events.map((eventName, index) => ({
      id: `REC-${1000 + index}`,
      eventName,
      category: ['Music', 'Conference', 'Sports', 'Art', 'Comedy'][index],
      confidence: 70 + Math.random() * 30,
      relevanceScore: 60 + Math.random() * 40,
      clickRate: 20 + Math.random() * 20,
      conversionRate: 10 + Math.random() * 15,
      impressions: 1000 + Math.random() * 2000,
    }));
  };

  const renderOverviewCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Accuracy',
        value: `${metrics.overview.accuracy.toFixed(1)}%`,
        icon: <AccuracyIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.primary.main,
      },
      {
        title: 'Coverage',
        value: `${metrics.overview.coverage.toFixed(1)}%`,
        icon: <CategoryIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.secondary.main,
      },
      {
        title: 'Click-Through',
        value: `${metrics.overview.clickThroughRate.toFixed(1)}%`,
        icon: <RecommendIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.success.main,
      },
      {
        title: 'Conversion',
        value: `${metrics.overview.conversionRate.toFixed(1)}%`,
        icon: <PersonIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.info.main,
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
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderPerformanceHistory = () => {
    if (!metrics) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(label).toLocaleTimeString()}
            </Typography>
            {payload.map((entry) => (
              <Typography
                key={entry.dataKey}
                variant="body1"
                sx={{ color: metricColors[entry.dataKey as keyof MetricColors] }}
              >
                {entry.name}: {entry.value.toFixed(1)}%
              </Typography>
            ))}
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={metrics.performance.history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => new Date(value).toLocaleTimeString()}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="Accuracy"
              stroke={metricColors.accuracy}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="coverage"
              name="Coverage"
              stroke={metricColors.coverage}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="diversity"
              name="Diversity"
              stroke={metricColors.diversity}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderFeatureImportance = () => {
    if (!metrics) return null;

    return (
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer>
          <RadarChart outerRadius={150} data={metrics.userPreferences.features}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              name="Importance"
              dataKey="importance"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.3}
            />
            <Radar
              name="Reliability"
              dataKey="reliability"
              stroke={theme.palette.secondary.main}
              fill={theme.palette.secondary.main}
              fillOpacity={0.3}
            />
            <Legend />
          </RadarChart>
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
              Performance Metrics
            </Typography>
            {renderPerformanceHistory()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Feature Importance
            </Typography>
            {renderFeatureImportance()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecommendationAnalytics;
