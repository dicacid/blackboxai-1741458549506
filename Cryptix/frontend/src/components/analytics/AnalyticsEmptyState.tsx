import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
} from '@mui/material';
import {
  DataUsage as DataIcon,
  SearchOff as SearchOffIcon,
  Error as ErrorIcon,
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

type EmptyStateType = 'noData' | 'noResults' | 'error' | 'filtered';

interface EmptyStateContent {
  icon: JSX.Element;
  title: string;
  message: string;
  primaryAction: {
    label: string;
    icon: JSX.Element;
  };
  secondaryAction?: {
    label: string;
    icon: JSX.Element;
  };
}

interface AnalyticsEmptyStateProps {
  className?: string;
  type?: EmptyStateType;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

const DEFAULT_CONTENT: Record<EmptyStateType, EmptyStateContent> = {
  noData: {
    icon: <DataIcon sx={{ fontSize: 64 }} />,
    title: 'No Data Available',
    message: 'There is no data available for the selected time period.',
    primaryAction: {
      label: 'Refresh Data',
      icon: <RefreshIcon />,
    },
  },
  noResults: {
    icon: <SearchOffIcon sx={{ fontSize: 64 }} />,
    title: 'No Results Found',
    message: 'No results match your search criteria.',
    primaryAction: {
      label: 'Clear Search',
      icon: <SearchOffIcon />,
    },
  },
  error: {
    icon: <ErrorIcon sx={{ fontSize: 64 }} />,
    title: 'Error Loading Data',
    message: 'An error occurred while loading the data. Please try again.',
    primaryAction: {
      label: 'Try Again',
      icon: <RefreshIcon />,
    },
    secondaryAction: {
      label: 'View Settings',
      icon: <SettingsIcon />,
    },
  },
  filtered: {
    icon: <FilterIcon sx={{ fontSize: 64 }} />,
    title: 'No Matching Data',
    message: 'No data matches your current filter settings.',
    primaryAction: {
      label: 'Clear Filters',
      icon: <FilterIcon />,
    },
  },
};

const AnalyticsEmptyState: React.FC<AnalyticsEmptyStateProps> = ({
  className,
  type = 'noData',
  title,
  message,
  icon,
  primaryAction,
  secondaryAction,
}) => {
  const theme = useTheme();
  const defaultContent = DEFAULT_CONTENT[type];

  const renderIcon = () => {
    if (icon) return icon;
    return React.cloneElement(defaultContent.icon, {
      sx: {
        fontSize: 64,
        color: type === 'error' ? 'error.main' : 'action.disabled',
        mb: 2,
      },
    });
  };

  const renderActions = () => {
    const actions = [];

    if (primaryAction || defaultContent.primaryAction) {
      actions.push(
        <Button
          key="primary"
          variant="contained"
          onClick={primaryAction?.onClick}
          startIcon={primaryAction?.icon || defaultContent.primaryAction.icon}
          color={type === 'error' ? 'error' : 'primary'}
        >
          {primaryAction?.label || defaultContent.primaryAction.label}
        </Button>
      );
    }

    if ((secondaryAction || defaultContent.secondaryAction)) {
      actions.push(
        <Button
          key="secondary"
          variant="outlined"
          onClick={secondaryAction?.onClick}
          startIcon={secondaryAction?.icon || defaultContent.secondaryAction?.icon}
          color={type === 'error' ? 'error' : 'primary'}
        >
          {secondaryAction?.label || defaultContent.secondaryAction?.label}
        </Button>
      );
    }

    return actions;
  };

  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        p: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        bgcolor: 'transparent',
      }}
    >
      {renderIcon()}

      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: type === 'error' ? 'error.main' : 'text.primary',
        }}
      >
        {title || defaultContent.title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {message || defaultContent.message}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {renderActions()}
      </Box>
    </Paper>
  );
};

// Helper components for common empty states
export const NoData: React.FC<Omit<AnalyticsEmptyStateProps, 'type'>> = (props) => (
  <AnalyticsEmptyState {...props} type="noData" />
);

export const NoResults: React.FC<Omit<AnalyticsEmptyStateProps, 'type'>> = (props) => (
  <AnalyticsEmptyState {...props} type="noResults" />
);

export const ErrorState: React.FC<Omit<AnalyticsEmptyStateProps, 'type'>> = (props) => (
  <AnalyticsEmptyState {...props} type="error" />
);

export const FilteredState: React.FC<Omit<AnalyticsEmptyStateProps, 'type'>> = (props) => (
  <AnalyticsEmptyState {...props} type="filtered" />
);

export default AnalyticsEmptyState;
