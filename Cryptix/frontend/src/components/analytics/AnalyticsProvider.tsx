import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material';

import analyticsService from '../../services/analyticsService';
import { DEFAULT_TIME_RANGES } from '../../constants/analytics';
import type { TimeRange, AnalyticsFilter, AnalyticsPreferences } from '../../types/analytics';

interface AnalyticsContextValue {
  timeRange: TimeRange;
  comparison: {
    enabled: boolean;
    timeRange?: TimeRange;
  };
  filters: AnalyticsFilter | null;
  preferences: AnalyticsPreferences;
  loading: boolean;
  error: string | null;
  setTimeRange: (start: string, end: string) => void;
  setComparison: (enabled: boolean, timeRange?: TimeRange) => void;
  setFilters: (filters: AnalyticsFilter | null) => void;
  updatePreferences: (preferences: Partial<AnalyticsPreferences>) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  defaultTimeRange?: keyof typeof DEFAULT_TIME_RANGES;
  defaultFilters?: AnalyticsFilter;
  defaultPreferences?: Partial<AnalyticsPreferences>;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const getDefaultTimeRange = (range: keyof typeof DEFAULT_TIME_RANGES): TimeRange => {
  const now = new Date();
  const days = DEFAULT_TIME_RANGES[range].days;
  
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const defaultPreferences: AnalyticsPreferences = {
  theme: 'system',
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  decimals: 2,
  notifications: {
    enabled: true,
    email: true,
    push: true,
  },
  display: {
    charts: true,
    tables: true,
    metrics: true,
  },
};

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  defaultTimeRange = 'LAST_30_DAYS',
  defaultFilters = null,
  defaultPreferences: initialPreferences = {},
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const theme = useTheme();

  // State
  const [timeRange, setTimeRangeState] = useState<TimeRange>(
    getDefaultTimeRange(defaultTimeRange)
  );
  const [comparison, setComparisonState] = useState<{
    enabled: boolean;
    timeRange?: TimeRange;
  }>({ enabled: false });
  const [filters, setFiltersState] = useState<AnalyticsFilter | null>(defaultFilters);
  const [preferences, setPreferences] = useState<AnalyticsPreferences>({
    ...defaultPreferences,
    ...initialPreferences,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const setTimeRange = useCallback((start: string, end: string) => {
    setTimeRangeState({ start, end });
  }, []);

  const setComparison = useCallback((enabled: boolean, timeRange?: TimeRange) => {
    setComparisonState({ enabled, timeRange });
  }, []);

  const setFilters = useCallback((filters: AnalyticsFilter | null) => {
    setFiltersState(filters);
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<AnalyticsPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences,
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data
      const data = await analyticsService.getAnalytics({
        timeRange,
        filters: filters || undefined,
      });

      // If comparison is enabled, fetch comparison data
      if (comparison.enabled && comparison.timeRange) {
        const comparisonData = await analyticsService.getComparison(
          timeRange,
          comparison.timeRange,
          filters || undefined
        );
        // Handle comparison data
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      setLoading(false);
    }
  }, [timeRange, comparison, filters]);

  // Auto-refresh
  React.useEffect(() => {
    if (!autoRefresh) return;

    refresh();
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  // Context value
  const value = useMemo(
    () => ({
      timeRange,
      comparison,
      filters,
      preferences,
      loading,
      error,
      setTimeRange,
      setComparison,
      setFilters,
      updatePreferences,
      refresh,
      clearError,
    }),
    [
      timeRange,
      comparison,
      filters,
      preferences,
      loading,
      error,
      setTimeRange,
      setComparison,
      setFilters,
      updatePreferences,
      refresh,
      clearError,
    ]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Helper hooks for specific analytics features
export const useTimeRange = () => {
  const { timeRange, setTimeRange } = useAnalytics();
  return { timeRange, setTimeRange };
};

export const useComparison = () => {
  const { comparison, setComparison } = useAnalytics();
  return { comparison, setComparison };
};

export const useFilters = () => {
  const { filters, setFilters } = useAnalytics();
  return { filters, setFilters };
};

export const usePreferences = () => {
  const { preferences, updatePreferences } = useAnalytics();
  return { preferences, updatePreferences };
};

export const useAnalyticsRefresh = () => {
  const { refresh, loading, error, clearError } = useAnalytics();
  return { refresh, loading, error, clearError };
};

// Higher-order component to wrap components that need analytics context
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & AnalyticsProviderProps> => {
  return ({ children, ...props }) => (
    <AnalyticsProvider {...props}>
      <Component {...(props as P)} />
    </AnalyticsProvider>
  );
};

export default AnalyticsProvider;
