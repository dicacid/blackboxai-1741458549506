import { AnalyticsFilter } from '../types';

interface TimeRange {
  start: string;
  end: string;
}

interface AnalyticsMetrics {
  users: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
  revenue: {
    total: number;
    average: number;
    growth: number;
  };
  transactions: {
    total: number;
    volume: number;
    average: number;
  };
  performance: {
    latency: number;
    uptime: number;
    errors: number;
  };
}

interface AnalyticsData {
  metrics: AnalyticsMetrics;
  trends: Array<{
    timestamp: string;
    [key: string]: any;
  }>;
  distribution: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
  comparison?: {
    metrics: AnalyticsMetrics;
    change: {
      [K in keyof AnalyticsMetrics]: {
        [P in keyof AnalyticsMetrics[K]]: number;
      };
    };
  };
}

class AnalyticsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '';
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}/api/analytics${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getAnalytics(timeRange: TimeRange, filters?: AnalyticsFilter): Promise<AnalyticsData> {
    const params = new URLSearchParams({
      start: timeRange.start,
      end: timeRange.end,
      ...(filters && { filters: JSON.stringify(filters) }),
    });

    return this.fetchWithAuth(`/data?${params}`);
  }

  async getComparison(
    timeRange: TimeRange,
    comparisonRange: TimeRange,
    filters?: AnalyticsFilter
  ): Promise<AnalyticsData> {
    const params = new URLSearchParams({
      start: timeRange.start,
      end: timeRange.end,
      compareStart: comparisonRange.start,
      compareEnd: comparisonRange.end,
      ...(filters && { filters: JSON.stringify(filters) }),
    });

    return this.fetchWithAuth(`/comparison?${params}`);
  }

  async exportAnalytics(
    format: 'csv' | 'pdf',
    options: {
      timeRange: TimeRange;
      filters?: AnalyticsFilter;
      includeCharts?: boolean;
    }
  ): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/analytics/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async saveAnalyticsFilter(filter: AnalyticsFilter & { name: string }): Promise<void> {
    await this.fetchWithAuth('/filters', {
      method: 'POST',
      body: JSON.stringify(filter),
    });
  }

  async getSavedFilters(): Promise<Array<AnalyticsFilter & { name: string }>> {
    return this.fetchWithAuth('/filters');
  }

  async deleteAnalyticsFilter(filterId: string): Promise<void> {
    await this.fetchWithAuth(`/filters/${filterId}`, {
      method: 'DELETE',
    });
  }

  async getRealtimeMetrics(): Promise<{
    activeUsers: number;
    transactions: number;
    revenue: number;
    errors: number;
  }> {
    return this.fetchWithAuth('/realtime');
  }

  // Helper methods for common analytics calculations
  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  // Data processing utilities
  aggregateByTime(
    data: Array<{ timestamp: string; value: number }>,
    interval: 'hour' | 'day' | 'week' | 'month'
  ): Array<{ timestamp: string; value: number }> {
    // Group data points by time interval and calculate average
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

    return Array.from(groups.entries()).map(([timestamp, values]) => ({
      timestamp,
      value: this.calculateAverage(values),
    }));
  }

  // Error handling and retry logic
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
