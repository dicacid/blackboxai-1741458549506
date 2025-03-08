import React from 'react';
import {
  Box,
  CircularProgress,
  Skeleton,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';

type LoadingType = 'spinner' | 'skeleton' | 'progress';

interface LoadingConfig {
  height?: number | string;
  width?: number | string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave';
  count?: number;
  spacing?: number;
}

interface AnalyticsLoadingProps {
  className?: string;
  type?: LoadingType;
  config?: LoadingConfig;
  message?: string;
  overlay?: boolean;
}

const DEFAULT_CONFIG: Record<LoadingType, LoadingConfig> = {
  spinner: {
    height: 200,
    width: '100%',
  },
  skeleton: {
    height: 60,
    width: '100%',
    variant: 'rectangular',
    animation: 'wave',
    count: 3,
    spacing: 2,
  },
  progress: {
    height: 200,
    width: '100%',
  },
};

const AnalyticsLoading: React.FC<AnalyticsLoadingProps> = ({
  className,
  type = 'spinner',
  config,
  message = 'Loading...',
  overlay = false,
}) => {
  const theme = useTheme();
  const mergedConfig = { ...DEFAULT_CONFIG[type], ...config };

  const renderSpinner = () => (
    <Box
      sx={{
        height: mergedConfig.height,
        width: mergedConfig.width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  const renderSkeleton = () => (
    <Box
      sx={{
        height: mergedConfig.height,
        width: mergedConfig.width,
        display: 'flex',
        flexDirection: 'column',
        gap: mergedConfig.spacing,
      }}
    >
      {Array.from({ length: mergedConfig.count || 1 }).map((_, index) => (
        <Skeleton
          key={index}
          variant={mergedConfig.variant}
          animation={mergedConfig.animation}
          height={typeof mergedConfig.height === 'number' 
            ? mergedConfig.height / (mergedConfig.count || 1) - (mergedConfig.spacing || 0)
            : mergedConfig.height
          }
        />
      ))}
    </Box>
  );

  const renderProgress = () => (
    <Box
      sx={{
        height: mergedConfig.height,
        width: mergedConfig.width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          position: 'relative',
        }}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          sx={{
            position: 'absolute',
            color: theme.palette.grey[200],
          }}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={{
            color: theme.palette.primary.main,
            animationDuration: '1s',
          }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  const renderContent = () => {
    switch (type) {
      case 'skeleton':
        return renderSkeleton();
      case 'progress':
        return renderProgress();
      default:
        return renderSpinner();
    }
  };

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          zIndex: theme.zIndex.modal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderContent()}
      </Box>
    );
  }

  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'transparent',
      }}
    >
      {renderContent()}
    </Paper>
  );
};

// Helper components for common loading states
export const SpinnerLoading: React.FC<Omit<AnalyticsLoadingProps, 'type'>> = (props) => (
  <AnalyticsLoading {...props} type="spinner" />
);

export const SkeletonLoading: React.FC<Omit<AnalyticsLoadingProps, 'type'>> = (props) => (
  <AnalyticsLoading {...props} type="skeleton" />
);

export const ProgressLoading: React.FC<Omit<AnalyticsLoadingProps, 'type'>> = (props) => (
  <AnalyticsLoading {...props} type="progress" />
);

export const OverlayLoading: React.FC<Omit<AnalyticsLoadingProps, 'overlay'>> = (props) => (
  <AnalyticsLoading {...props} overlay />
);

export default AnalyticsLoading;
