import React, { useState } from 'react';
import {
  Box,
  Grid,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as RevenueIcon,
  ShoppingCart as TransactionsIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

import AnalyticsLayout from '../components/analytics/AnalyticsLayout';
import AnalyticsMetric from '../components/analytics/AnalyticsMetric';
import AnalyticsChart from '../components/analytics/AnalyticsChart';
import AnalyticsTable from '../components/analytics/AnalyticsTable';
import AnalyticsGrid from '../components/analytics/AnalyticsGrid';
import { useAnalytics } from '../components/analytics/AnalyticsProvider';
import { useAnalyticsData } from '../hooks/useAnalytics';
import { GRID_LAYOUTS } from '../constants/analytics';
import type { DashboardWidget, ChartSeries, ChartDataPoint } from '../types/analytics';

interface DashboardItem {
  id: string;
  type: 'metric' | 'chart' | 'table';
  title: string;
  size: {
    w: number;
    h: number;
  };
  position: {
    x: number;
    y: number;
  };
  config: {
    type?: 'line' | 'bar' | 'area';
    series?: string[];
    limit?: number;
  };
  draggable?: boolean;
  fullscreenable?: boolean;
  refreshable?: boolean;
  configurable?: boolean;
}

const DEFAULT_WIDGETS: DashboardItem[] = [
  {
    id: 'overview',
    type: 'metric',
    title: 'Overview Metrics',
    size: { w: 12, h: 1 },
    position: { x: 0, y: 0 },
    config: {},
    draggable: true,
    refreshable: true,
  },
  {
    id: 'revenue-trend',
    type: 'chart',
    title: 'Revenue Trend',
    size: { w: 8, h: 2 },
    position: { x: 0, y: 1 },
    config: {
      type: 'line',
      series: ['revenue'],
    },
    draggable: true,
    refreshable: true,
    fullscreenable: true,
  },
  {
    id: 'top-transactions',
    type: 'table',
    title: 'Recent Transactions',
    size: { w: 4, h: 2 },
    position: { x: 8, y: 1 },
    config: {
      limit: 5,
    },
    draggable: true,
    refreshable: true,
  },
  {
    id: 'performance',
    type: 'chart',
    title: 'System Performance',
    size: { w: 6, h: 2 },
    position: { x: 0, y: 3 },
    config: {
      type: 'area',
      series: ['latency', 'errors'],
    },
    draggable: true,
    refreshable: true,
    fullscreenable: true,
  },
  {
    id: 'security',
    type: 'chart',
    title: 'Security Overview',
    size: { w: 6, h: 2 },
    position: { x: 6, y: 3 },
    config: {
      type: 'bar',
      series: ['threats', 'incidents'],
    },
    draggable: true,
    refreshable: true,
    fullscreenable: true,
  },
];

const mapWidgetToGridItem = (widget: DashboardItem) => ({
  id: widget.id,
  title: widget.title,
  width: {
    xs: widget.size.w,
    sm: widget.size.w,
    md: widget.size.w,
    lg: widget.size.w,
  },
  x: widget.position.x,
  y: widget.position.y,
  draggable: widget.draggable,
});

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const { timeRange, comparison } = useAnalytics();
  const [widgets, setWidgets] = useState<DashboardItem[]>(DEFAULT_WIDGETS);

  const { data, loading, error, refresh } = useAnalyticsData({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  const handleWidgetMove = (sourceId: string, targetId: string) => {
    const sourceIndex = widgets.findIndex(w => w.id === sourceId);
    const targetIndex = widgets.findIndex(w => w.id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(sourceIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);
    setWidgets(newWidgets);
  };

  const renderMetrics = () => {
    if (!data?.metrics) return null;

    const metrics = [
      {
        title: 'Total Revenue',
        value: data.metrics.revenue.total.current,
        change: data.metrics.revenue.total.change,
        icon: <RevenueIcon />,
        iconColor: theme.palette.primary.main,
      },
      {
        title: 'Transactions',
        value: data.metrics.transactions.total.current,
        change: data.metrics.transactions.total.change,
        icon: <TransactionsIcon />,
        iconColor: theme.palette.secondary.main,
      },
      {
        title: 'Performance',
        value: data.metrics.performance.latency.current,
        change: data.metrics.performance.latency.change,
        icon: <PerformanceIcon />,
        iconColor: theme.palette.success.main,
      },
      {
        title: 'Security Score',
        value: data.metrics.security.compliance.current,
        change: data.metrics.security.compliance.change,
        icon: <SecurityIcon />,
        iconColor: theme.palette.info.main,
      },
    ];

    return (
      <Grid container spacing={3}>
        {metrics.map((metric) => (
          <Grid key={metric.title} item {...GRID_LAYOUTS.COMPACT}>
            <AnalyticsMetric {...metric} />
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderWidget = (widget: DashboardItem) => {
    if (!data) return null;

    switch (widget.type) {
      case 'metric':
        return renderMetrics();

      case 'chart':
        if (!widget.config.type || !widget.config.series) return null;
        return (
          <AnalyticsChart
            type={widget.config.type}
            data={data.trends}
            series={widget.config.series.map((seriesKey: string) => ({
              dataKey: seriesKey,
              name: seriesKey,
              data: data.trends.map((point: ChartDataPoint) => ({
                timestamp: point.timestamp,
                value: point[seriesKey] as number,
              })),
            }))}
          />
        );

      case 'table':
        return (
          <AnalyticsTable
            data={data.transactions?.slice(0, widget.config.limit)}
            columns={[
              { id: 'id', label: 'ID' },
              { id: 'amount', label: 'Amount' },
              { id: 'status', label: 'Status' },
              { id: 'timestamp', label: 'Time' },
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AnalyticsLayout
      title="Analytics Dashboard"
      subtitle="Real-time analytics and insights"
      toolbar={{
        onRefresh: refresh,
        onExport: () => {}, // Implement export functionality
        onSettings: () => {}, // Implement settings functionality
      }}
      loading={loading}
      error={error || undefined}
    >
      <AnalyticsGrid
        items={widgets.map(mapWidgetToGridItem)}
        onItemMove={handleWidgetMove}
        spacing={3}
      >
        {widgets.map((widget) => (
          <Box key={widget.id} sx={{ height: '100%' }}>
            {renderWidget(widget)}
          </Box>
        ))}
      </AnalyticsGrid>
    </AnalyticsLayout>
  );
};

export default AnalyticsDashboard;
