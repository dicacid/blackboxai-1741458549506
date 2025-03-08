import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Collapse,
  Divider,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import AnalyticsLoading from './AnalyticsLoading';
import AnalyticsEmptyState from './AnalyticsEmptyState';

interface AnalyticsCardAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface AnalyticsCardProps {
  className?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  info?: string;
  actions?: AnalyticsCardAction[];
  collapsible?: boolean;
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
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onSettings?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  children?: React.ReactNode;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  className,
  title,
  subtitle,
  icon,
  info,
  actions,
  collapsible = false,
  loading = false,
  error,
  empty,
  onRefresh,
  onFullscreen,
  onSettings,
  onDownload,
  onShare,
  children,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const renderContent = () => {
    if (loading) {
      return <AnalyticsLoading />;
    }

    if (error || empty) {
      return (
        <AnalyticsEmptyState
          type={error ? 'error' : empty?.type}
          title={error || empty?.title}
          message={empty?.message}
          primaryAction={empty?.action}
        />
      );
    }

    return children;
  };

  const defaultActions: AnalyticsCardAction[] = [
    ...(onRefresh ? [{
      label: 'Refresh',
      icon: <RefreshIcon />,
      onClick: onRefresh,
    }] : []),
    ...(onFullscreen ? [{
      label: 'Fullscreen',
      icon: <FullscreenIcon />,
      onClick: onFullscreen,
    }] : []),
    ...(onSettings ? [{
      label: 'Settings',
      icon: <SettingsIcon />,
      onClick: onSettings,
    }] : []),
    ...(onDownload ? [{
      label: 'Download',
      icon: <DownloadIcon />,
      onClick: onDownload,
    }] : []),
    ...(onShare ? [{
      label: 'Share',
      icon: <ShareIcon />,
      onClick: onShare,
    }] : []),
    ...(actions || []),
  ];

  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          borderBottom: expanded ? 1 : 0,
          borderColor: 'divider',
        }}
      >
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1">
              {title}
            </Typography>
            {info && (
              <Tooltip title={info}>
                <InfoIcon
                  sx={{
                    fontSize: 16,
                    color: 'action.active',
                    cursor: 'help',
                  }}
                />
              </Tooltip>
            )}
          </Box>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {collapsible && (
            <IconButton size="small" onClick={handleExpand}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}

          {defaultActions.length > 0 && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
              >
                {defaultActions.map((action) => (
                  <MenuItem
                    key={action.label}
                    onClick={() => {
                      action.onClick();
                      handleMenuClose();
                    }}
                  >
                    <ListItemIcon>{action.icon}</ListItemIcon>
                    <ListItemText>{action.label}</ListItemText>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={!collapsible || expanded} sx={{ flex: 1 }}>
        <Box
          sx={{
            height: '100%',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          {renderContent()}
        </Box>
      </Collapse>
    </Paper>
  );
};

// Helper components for common card variants
export const SimpleCard: React.FC<Omit<AnalyticsCardProps, 'collapsible' | 'actions'>> = (props) => (
  <AnalyticsCard {...props} />
);

export const CollapsibleCard: React.FC<Omit<AnalyticsCardProps, 'collapsible'>> = (props) => (
  <AnalyticsCard {...props} collapsible />
);

export const ActionCard: React.FC<Omit<AnalyticsCardProps, 'actions'>> = (props) => (
  <AnalyticsCard
    {...props}
    actions={[
      {
        label: 'Refresh',
        icon: <RefreshIcon />,
        onClick: props.onRefresh || (() => {}),
      },
      {
        label: 'Settings',
        icon: <SettingsIcon />,
        onClick: props.onSettings || (() => {}),
      },
    ]}
  />
);

export default AnalyticsCard;
