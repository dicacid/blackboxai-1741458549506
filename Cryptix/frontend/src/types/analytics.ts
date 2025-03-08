// Base Types
export interface TimeRange {
  start: string;
  end: string;
}

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';
export type SortDirection = 'asc' | 'desc';
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'radar';

// Filter Types
export interface AnalyticsFilter {
  metrics?: string[];
  segments?: string[];
  categories?: string[];
  status?: string[];
  search?: string;
  sort?: {
    field: string;
    direction: SortDirection;
  };
  range?: {
    field: string;
    min: number;
    max: number;
  };
}

// Metric Types
export interface MetricValue {
  current: number;
  previous?: number;
  change?: number;
  target?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface BaseMetrics {
  total: MetricValue;
  average: MetricValue;
  growth: MetricValue;
}

export interface AnalyticsMetrics {
  users: BaseMetrics & {
    active: MetricValue;
    new: MetricValue;
    retention: MetricValue;
  };
  revenue: BaseMetrics & {
    recurring: MetricValue;
    arpu: MetricValue;
    ltv: MetricValue;
  };
  transactions: BaseMetrics & {
    success: MetricValue;
    pending: MetricValue;
    failed: MetricValue;
  };
  performance: BaseMetrics & {
    latency: MetricValue;
    uptime: MetricValue;
    errors: MetricValue;
  };
  security: BaseMetrics & {
    threats: MetricValue;
    incidents: MetricValue;
    compliance: MetricValue;
  };
}

// Chart Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  [key: string]: any;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: ChartType;
}

export interface ChartOptions {
  stacked?: boolean;
  percentage?: boolean;
  animation?: boolean;
  tooltip?: boolean;
  legend?: boolean;
  grid?: boolean;
}

// Distribution Types
export interface DistributionItem {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface Distribution {
  total: number;
  items: DistributionItem[];
}

// Comparison Types
export interface ComparisonData {
  current: AnalyticsMetrics;
  previous: AnalyticsMetrics;
  changes: {
    [K in keyof AnalyticsMetrics]: {
      [P in keyof AnalyticsMetrics[K]]: number;
    };
  };
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'pdf';
  timeRange: TimeRange;
  filters?: AnalyticsFilter;
  includeCharts?: boolean;
  customization?: {
    title?: string;
    logo?: boolean;
    notes?: string;
  };
}

// Alert Types
export interface AnalyticsAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  metric?: string;
  threshold?: number;
  value?: number;
  acknowledged?: boolean;
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'distribution';
  title: string;
  size: {
    w: number;
    h: number;
  };
  position: {
    x: number;
    y: number;
  };
  config: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'fluid';
  shared?: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface AnalyticsResponse<T> {
  data: T;
  metadata?: {
    timeRange: TimeRange;
    filters?: AnalyticsFilter;
    comparison?: boolean;
    updated: string;
  };
}

export interface AnalyticsError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Component Props Types
export interface AnalyticsComponentProps {
  className?: string;
  loading?: boolean;
  error?: string | null;
  data?: any;
  onRefresh?: () => void;
}

// Utility Types
export type MetricType = keyof AnalyticsMetrics;
export type SubMetricType<T extends MetricType> = keyof AnalyticsMetrics[T];

// Type Guards
export const isMetricValue = (value: any): value is MetricValue => {
  return typeof value === 'object' && value !== null && 'current' in value;
};

export const isChartSeries = (value: any): value is ChartSeries => {
  return typeof value === 'object' && value !== null && 'data' in value && Array.isArray(value.data);
};

export const isDistribution = (value: any): value is Distribution => {
  return typeof value === 'object' && value !== null && 'items' in value && Array.isArray(value.items);
};
