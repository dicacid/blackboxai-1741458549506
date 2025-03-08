import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';

import AnalyticsDatePicker from './AnalyticsDatePicker';
import AnalyticsComparison from './AnalyticsComparison';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface AnalyticsHeaderProps {
  className?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  onDateChange?: (range: { start: Date; end: Date }) => void;
  onComparisonChange?: (comparison: { enabled: boolean; timeRange?: { start: string; end: string } }) => void;
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  className,
  title,
  subtitle,
  breadcrumbs,
  actions,
  onDateChange,
  onComparisonChange,
}) => {
  const theme = useTheme();

  return (
    <Box
      className={className}
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return crumb.path && !isLast ? (
                <Link
                  key={crumb.label}
                  color="inherit"
                  href={crumb.path}
                  sx={{
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography
                  key={crumb.label}
                  color={isLast ? 'text.primary' : 'inherit'}
                >
                  {crumb.label}
                </Typography>
              );
            })}
          </Breadcrumbs>
        )}

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {actions && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {actions}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <AnalyticsDatePicker
            onChange={onDateChange}
          />
          <Divider orientation="vertical" flexItem />
          <AnalyticsComparison
            onChange={onComparisonChange}
          />
        </Box>
      </Stack>
    </Box>
  );
};

// Helper components for common header variants
export const SimpleHeader: React.FC<Omit<AnalyticsHeaderProps, 'breadcrumbs' | 'subtitle'>> = (props) => (
  <AnalyticsHeader {...props} />
);

export const DetailHeader: React.FC<Omit<AnalyticsHeaderProps, 'breadcrumbs'>> = (props) => (
  <AnalyticsHeader {...props} />
);

export const FullHeader: React.FC<AnalyticsHeaderProps> = (props) => (
  <AnalyticsHeader {...props} />
);

export default AnalyticsHeader;
