import React, { useState } from 'react';
import {
  Box,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AnalyticsHeader from './AnalyticsHeader';
import AnalyticsToolbar from './AnalyticsToolbar';
import AnalyticsFilters from './AnalyticsFilters';
import AnalyticsLoading from './AnalyticsLoading';
import AnalyticsEmptyState from './AnalyticsEmptyState';
import { useAnalytics } from './AnalyticsProvider';

interface AnalyticsLayoutProps {
  className?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  toolbar?: {
    views?: Array<{
      value: string;
      label: string;
      icon: React.ReactNode;
    }>;
    sortOptions?: Array<{
      value: string;
      label: string;
    }>;
    columns?: Array<{
      value: string;
      label: string;
      visible: boolean;
    }>;
    onViewChange?: (view: string) => void;
    onSortChange?: (sort: string) => void;
    onColumnChange?: (columns: Array<{ value: string; label: string; visible: boolean }>) => void;
    onSearch?: (query: string) => void;
    onExport?: () => void;
    onPrint?: () => void;
    onShare?: () => void;
    onRefresh?: () => void;
    onSettings?: () => void;
  };
  filters?: {
    metrics?: string[];
    segments?: string[];
    onFilterChange?: (filters: Record<string, any>) => void;
  };
  loading?: boolean;
  error?: string;
  empty?: {
    type?: 'noData' | 'noResults' | 'error' | 'filtered';
    title?: string;
    message?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  children?: React.ReactNode;
}

export const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({
  className,
  title,
  subtitle,
  breadcrumbs,
  toolbar,
  filters,
  loading,
  error,
  empty,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);
  const { timeRange, comparison } = useAnalytics();

  const handleFilterToggle = () => {
    setFiltersOpen(!filtersOpen);
  };

  const renderContent = () => {
    if (error) {
      return (
        <AnalyticsEmptyState
          type="error"
          title={empty?.title || 'Error Loading Data'}
          message={error}
          primaryAction={empty?.action}
        />
      );
    }

    if (loading) {
      return <AnalyticsLoading />;
    }

    if (empty) {
      return (
        <AnalyticsEmptyState
          type={empty.type}
          title={empty.title}
          message={empty.message}
          primaryAction={empty.action}
        />
      );
    }

    return children;
  };

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <AnalyticsHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        timeRange={timeRange}
        comparison={comparison}
      />

      {toolbar && (
        <>
          <AnalyticsToolbar
            {...toolbar}
            onFilterToggle={handleFilterToggle}
            filtersOpen={filtersOpen}
          />
          <Divider />
        </>
      )}

      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        {filters && filtersOpen && (
          <Paper
            sx={{
              width: 280,
              flexShrink: 0,
              borderRadius: 0,
              borderRight: 1,
              borderColor: 'divider',
              display: {
                xs: 'none',
                sm: 'block',
              },
            }}
          >
            <AnalyticsFilters
              metrics={filters.metrics}
              segments={filters.segments}
              onFilterChange={filters.onFilterChange}
            />
          </Paper>
        )}

        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 3,
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

// Helper components for common layout patterns
export const AnalyticsFullPage: React.FC<AnalyticsLayoutProps> = (props) => (
  <Box
    sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    <AnalyticsLayout {...props} />
  </Box>
);

export const AnalyticsCardLayout: React.FC<AnalyticsLayoutProps> = (props) => (
  <Paper
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    <AnalyticsLayout {...props} />
  </Paper>
);

export const AnalyticsPanel: React.FC<AnalyticsLayoutProps> = (props) => (
  <Box
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    <AnalyticsLayout {...props} />
  </Box>
);

export default AnalyticsLayout;
