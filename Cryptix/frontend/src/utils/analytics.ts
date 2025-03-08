import { 
  TimeRange,
  MetricValue,
  ChartDataPoint,
  DistributionItem,
  AnalyticsMetrics,
  ComparisonData,
} from '../types/analytics';

// Time and Date Utilities
export const createTimeRange = (days: number): TimeRange => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export const getCommonTimeRanges = () => ({
  today: createTimeRange(0),
  yesterday: createTimeRange(1),
  last7Days: createTimeRange(7),
  last30Days: createTimeRange(30),
  last90Days: createTimeRange(90),
});

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(date).toLocaleString(undefined, options || defaultOptions);
};

// Number Formatting Utilities
export const formatNumber = (value: number, options?: {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  compact?: boolean;
}): string => {
  const { decimals = 2, prefix = '', suffix = '', compact = false } = options || {};
  
  let formatted = value;
  let compactSuffix = '';

  if (compact) {
    if (value >= 1e9) {
      formatted = value / 1e9;
      compactSuffix = 'B';
    } else if (value >= 1e6) {
      formatted = value / 1e6;
      compactSuffix = 'M';
    } else if (value >= 1e3) {
      formatted = value / 1e3;
      compactSuffix = 'K';
    }
  }

  return `${prefix}${formatted.toFixed(decimals)}${compactSuffix}${suffix}`;
};

export const formatCurrency = (value: number, currency = 'USD', compact = false): string => {
  return formatNumber(value, {
    decimals: 2,
    prefix: currency === 'USD' ? '$' : '',
    suffix: currency !== 'USD' ? ` ${currency}` : '',
    compact,
  });
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return formatNumber(value, { decimals, suffix: '%' });
};

// Metric Calculations
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

export const getTrend = (change: number): 'up' | 'down' | 'neutral' => {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
};

// Data Processing
export const aggregateByTime = (
  data: ChartDataPoint[],
  interval: 'hour' | 'day' | 'week' | 'month'
): ChartDataPoint[] => {
  const groups = new Map<string, number[]>();

  data.forEach(({ timestamp, value }) => {
    const date = new Date(timestamp);
    let key: string;

    switch (interval) {
      case 'hour':
        key = date.toISOString().slice(0, 13);
        break;
      case 'day':
        key = date.toISOString().slice(0, 10);
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = date.toISOString().slice(0, 7);
        break;
    }

    const values = groups.get(key) || [];
    values.push(value);
    groups.set(key, values);
  });

  return Array.from(groups.entries())
    .map(([timestamp, values]) => ({
      timestamp,
      value: values.reduce((sum, v) => sum + v, 0) / values.length,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

export const calculateDistribution = (
  data: Record<string, number>
): DistributionItem[] => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  return Object.entries(data)
    .map(([label, value]) => ({
      label,
      value,
      percentage: calculatePercentage(value, total),
    }))
    .sort((a, b) => b.value - a.value);
};

// Comparison Utilities
export const compareMetrics = (
  current: AnalyticsMetrics,
  previous: AnalyticsMetrics
): ComparisonData['changes'] => {
  const changes = {} as ComparisonData['changes'];

  for (const category in current) {
    changes[category as keyof AnalyticsMetrics] = {} as any;
    for (const metric in current[category as keyof AnalyticsMetrics]) {
      const currentValue = (current[category as keyof AnalyticsMetrics] as any)[metric].current;
      const previousValue = (previous[category as keyof AnalyticsMetrics] as any)[metric].current;
      (changes[category as keyof AnalyticsMetrics] as any)[metric] = calculateGrowth(
        currentValue,
        previousValue
      );
    }
  }

  return changes;
};

// Color Utilities
export const getMetricColor = (value: MetricValue, thresholds?: {
  success?: number;
  warning?: number;
  error?: number;
}) => {
  const { success = 0, warning = -10, error = -20 } = thresholds || {};
  const change = value.change || 0;

  if (change >= success) return 'success.main';
  if (change >= warning) return 'warning.main';
  if (change >= error) return 'error.main';
  return 'error.dark';
};

export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#2196f3', // blue
    '#4caf50', // green
    '#f44336', // red
    '#ff9800', // orange
    '#9c27b0', // purple
    '#00bcd4', // cyan
    '#ff5722', // deep orange
    '#3f51b5', // indigo
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Generate additional colors by adjusting hue
  const result = [...baseColors];
  const step = 360 / (count - baseColors.length);

  for (let i = baseColors.length; i < count; i++) {
    const hue = (i - baseColors.length) * step;
    result.push(`hsl(${hue}, 70%, 50%)`);
  }

  return result;
};

// Export Utilities
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default {
  createTimeRange,
  getCommonTimeRanges,
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercentage,
  calculateGrowth,
  calculatePercentage,
  getTrend,
  aggregateByTime,
  calculateDistribution,
  compareMetrics,
  getMetricColor,
  generateChartColors,
  downloadBlob,
};
