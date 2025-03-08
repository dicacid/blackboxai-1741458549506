import { TimeGranularity, ChartType } from '../types/analytics';

// Time Constants
export const TIME_GRANULARITIES: Array<{
  value: TimeGranularity;
  label: string;
  milliseconds: number;
}> = [
  { value: 'hour', label: 'Hourly', milliseconds: 60 * 60 * 1000 },
  { value: 'day', label: 'Daily', milliseconds: 24 * 60 * 60 * 1000 },
  { value: 'week', label: 'Weekly', milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { value: 'month', label: 'Monthly', milliseconds: 30 * 24 * 60 * 60 * 1000 },
];

export const DEFAULT_TIME_RANGES = {
  TODAY: { label: 'Today', days: 0 },
  YESTERDAY: { label: 'Yesterday', days: 1 },
  LAST_7_DAYS: { label: 'Last 7 Days', days: 7 },
  LAST_30_DAYS: { label: 'Last 30 Days', days: 30 },
  LAST_90_DAYS: { label: 'Last 90 Days', days: 90 },
  LAST_365_DAYS: { label: 'Last Year', days: 365 },
} as const;

// Chart Constants
export const CHART_TYPES: Array<{
  value: ChartType;
  label: string;
  icon: string;
}> = [
  { value: 'line', label: 'Line Chart', icon: 'show_chart' },
  { value: 'bar', label: 'Bar Chart', icon: 'bar_chart' },
  { value: 'area', label: 'Area Chart', icon: 'area_chart' },
  { value: 'pie', label: 'Pie Chart', icon: 'pie_chart' },
  { value: 'radar', label: 'Radar Chart', icon: 'radar' },
];

export const CHART_COLORS = {
  PRIMARY: '#2196f3',
  SECONDARY: '#4caf50',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  INFO: '#00bcd4',
  SUCCESS: '#4caf50',
  NEUTRAL: '#9e9e9e',
} as const;

export const CHART_COLOR_SCHEMES = {
  DEFAULT: [
    CHART_COLORS.PRIMARY,
    CHART_COLORS.SECONDARY,
    CHART_COLORS.ERROR,
    CHART_COLORS.WARNING,
    CHART_COLORS.INFO,
  ],
  MONOCHROME: [
    '#2196f3',
    '#1e88e5',
    '#1976d2',
    '#1565c0',
    '#0d47a1',
  ],
  RAINBOW: [
    '#ff0000',
    '#ff9900',
    '#ffff00',
    '#00ff00',
    '#00ffff',
    '#0000ff',
    '#9900ff',
  ],
} as const;

// Metric Constants
export const METRIC_THRESHOLDS = {
  CRITICAL: {
    success: 90,
    warning: 75,
    error: 60,
  },
  HIGH: {
    success: 80,
    warning: 65,
    error: 50,
  },
  MEDIUM: {
    success: 70,
    warning: 55,
    error: 40,
  },
  LOW: {
    success: 60,
    warning: 45,
    error: 30,
  },
} as const;

export const TREND_ICONS = {
  up: 'trending_up',
  down: 'trending_down',
  neutral: 'trending_flat',
} as const;

// Filter Constants
export const DEFAULT_FILTERS = {
  metrics: [],
  segments: [],
  categories: [],
  status: [],
  sort: {
    field: 'timestamp',
    direction: 'desc' as const,
  },
};

export const FILTER_OPERATORS = {
  EQUALS: { value: 'eq', label: 'Equals' },
  NOT_EQUALS: { value: 'ne', label: 'Not Equals' },
  GREATER_THAN: { value: 'gt', label: 'Greater Than' },
  LESS_THAN: { value: 'lt', label: 'Less Than' },
  CONTAINS: { value: 'contains', label: 'Contains' },
  NOT_CONTAINS: { value: 'not_contains', label: 'Not Contains' },
  IN: { value: 'in', label: 'In' },
  NOT_IN: { value: 'not_in', label: 'Not In' },
} as const;

// Export Constants
export const EXPORT_FORMATS = {
  CSV: { value: 'csv', label: 'CSV', icon: 'description' },
  PDF: { value: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
} as const;

export const EXPORT_TEMPLATES = {
  BASIC: {
    includeCharts: false,
    customization: {
      title: 'Analytics Report',
      logo: true,
      notes: '',
    },
  },
  DETAILED: {
    includeCharts: true,
    customization: {
      title: 'Detailed Analytics Report',
      logo: true,
      notes: 'Generated from Cryptix Analytics Dashboard',
    },
  },
} as const;

// Layout Constants
export const GRID_BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
} as const;

export const GRID_LAYOUTS = {
  COMPACT: {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
  },
  NORMAL: {
    xs: 12,
    sm: 6,
    md: 6,
    lg: 4,
  },
  WIDE: {
    xs: 12,
    sm: 12,
    md: 6,
    lg: 6,
  },
} as const;

// Animation Constants
export const ANIMATION_DURATIONS = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
} as const;

export const ANIMATION_EASINGS = {
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASE_OUT: 'cubic-bezier(0.0, 0, 0.2, 1)',
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  SHARP: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch analytics data',
  EXPORT_FAILED: 'Failed to export analytics data',
  INVALID_DATE: 'Invalid date range selected',
  INVALID_FILTER: 'Invalid filter configuration',
  NO_DATA: 'No data available for the selected criteria',
} as const;

export default {
  TIME_GRANULARITIES,
  DEFAULT_TIME_RANGES,
  CHART_TYPES,
  CHART_COLORS,
  CHART_COLOR_SCHEMES,
  METRIC_THRESHOLDS,
  TREND_ICONS,
  DEFAULT_FILTERS,
  FILTER_OPERATORS,
  EXPORT_FORMATS,
  EXPORT_TEMPLATES,
  GRID_BREAKPOINTS,
  GRID_LAYOUTS,
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
  ERROR_MESSAGES,
};
