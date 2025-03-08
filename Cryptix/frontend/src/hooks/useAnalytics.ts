import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAnalytics as useAnalyticsContext } from '../components/analytics/AnalyticsProvider';
import analyticsService from '../services/analyticsService';
import type { AnalyticsFilter } from '../types';

interface UseAnalyticsDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  comparison?: boolean;
  filters?: AnalyticsFilter;
}

interface UseAnalyticsDataResult {
  data: any;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAnalyticsData = (
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataResult => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    comparison = false,
    filters,
  } = options;

  const { timeRange, comparison: comparisonRange } = useAnalyticsContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(prevLoading => !data && prevLoading);

      let result;
      if (comparison && comparisonRange.enabled) {
        result = await analyticsService.getComparison(
          timeRange,
          comparisonRange.timeRange!,
          filters
        );
      } else {
        result = await analyticsService.getAnalytics(timeRange, filters);
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, comparisonRange, comparison, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
};

export const useAnalyticsFilters = () => {
  const [savedFilters, setSavedFilters] = useState<Array<AnalyticsFilter & { name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(async () => {
    try {
      setError(null);
      const filters = await analyticsService.getSavedFilters();
      setSavedFilters(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved filters');
      console.error('Error fetching saved filters:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const saveFilter = useCallback(async (filter: AnalyticsFilter & { name: string }) => {
    try {
      await analyticsService.saveAnalyticsFilter(filter);
      await fetchFilters();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save filter');
    }
  }, [fetchFilters]);

  const deleteFilter = useCallback(async (filterId: string) => {
    try {
      await analyticsService.deleteAnalyticsFilter(filterId);
      await fetchFilters();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete filter');
    }
  }, [fetchFilters]);

  return {
    savedFilters,
    loading,
    error,
    saveFilter,
    deleteFilter,
    refresh: fetchFilters,
  };
};

export const useAnalyticsExport = () => {
  const { timeRange, filters } = useAnalyticsContext();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (
    format: 'csv' | 'pdf',
    options?: {
      includeCharts?: boolean;
    }
  ) => {
    try {
      setError(null);
      setExporting(true);

      const blob = await analyticsService.exportAnalytics(format, {
        timeRange,
        filters,
        ...options,
      });

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics data');
      console.error('Error exporting analytics data:', err);
      throw err;
    } finally {
      setExporting(false);
    }
  }, [timeRange, filters]);

  return {
    exportData,
    exporting,
    error,
  };
};

export const useAnalyticsCalculations = () => {
  return useMemo(() => ({
    calculateGrowth: analyticsService.calculateGrowth,
    calculatePercentage: analyticsService.calculatePercentage,
    calculateAverage: analyticsService.calculateAverage,
    calculateMedian: analyticsService.calculateMedian,
    aggregateByTime: analyticsService.aggregateByTime,
  }), []);
};

export const useRealtimeAnalytics = (
  enabled = true,
  interval = 5000
) => {
  const [data, setData] = useState<{
    activeUsers: number;
    transactions: number;
    revenue: number;
    errors: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealtimeData = useCallback(async () => {
    try {
      setError(null);
      const metrics = await analyticsService.getRealtimeMetrics();
      setData(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch realtime metrics');
      console.error('Error fetching realtime metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchRealtimeData();
    const intervalId = setInterval(fetchRealtimeData, interval);
    return () => clearInterval(intervalId);
  }, [enabled, interval, fetchRealtimeData]);

  return {
    data,
    loading,
    error,
    refresh: fetchRealtimeData,
  };
};

export default {
  useAnalyticsData,
  useAnalyticsFilters,
  useAnalyticsExport,
  useAnalyticsCalculations,
  useRealtimeAnalytics,
};
