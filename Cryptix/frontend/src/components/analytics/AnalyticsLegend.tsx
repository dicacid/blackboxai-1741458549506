import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Checkbox,
  Paper,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Circle as CircleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface LegendItem {
  id: string;
  label: string;
  color: string;
  value?: number | string;
  percentage?: number;
  hidden?: boolean;
}

interface AnalyticsLegendProps {
  className?: string;
  items: LegendItem[];
  title?: string;
  collapsible?: boolean;
  interactive?: boolean;
  showValues?: boolean;
  showPercentages?: boolean;
  maxItems?: number;
  layout?: 'horizontal' | 'vertical';
  onItemToggle?: (id: string, hidden: boolean) => void;
  onItemClick?: (id: string) => void;
}

const AnalyticsLegend: React.FC<AnalyticsLegendProps> = ({
  className,
  items,
  title,
  collapsible = true,
  interactive = true,
  showValues = false,
  showPercentages = false,
  maxItems = 5,
  layout = 'vertical',
  onItemToggle,
  onItemClick,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const displayedItems = showAll ? items : items.slice(0, maxItems);
  const hasMoreItems = items.length > maxItems;

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const handleShowMore = () => {
    setShowAll(!showAll);
  };

  const handleItemToggle = (item: LegendItem, event: React.MouseEvent) => {
    event.stopPropagation();
    onItemToggle?.(item.id, !item.hidden);
  };

  const renderLegendItem = (item: LegendItem) => (
    <Box
      key={item.id}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.5,
        cursor: interactive ? 'pointer' : 'default',
        opacity: item.hidden ? 0.5 : 1,
        '&:hover': interactive ? {
          bgcolor: 'action.hover',
          borderRadius: 1,
        } : undefined,
      }}
      onClick={() => interactive && onItemClick?.(item.id)}
    >
      {interactive ? (
        <Checkbox
          checked={!item.hidden}
          onClick={(e) => handleItemToggle(item, e)}
          icon={<CircleIcon sx={{ color: item.color }} />}
          checkedIcon={<CircleIcon sx={{ color: item.color }} />}
          size="small"
        />
      ) : (
        <CircleIcon sx={{ color: item.color, fontSize: 20 }} />
      )}

      <Typography
        variant="body2"
        sx={{
          flex: 1,
          minWidth: 100,
          color: item.hidden ? 'text.disabled' : 'text.primary',
        }}
      >
        {item.label}
      </Typography>

      {showValues && item.value !== undefined && (
        <Typography
          variant="body2"
          sx={{
            color: item.hidden ? 'text.disabled' : 'text.secondary',
            minWidth: 60,
            textAlign: 'right',
          }}
        >
          {typeof item.value === 'number'
            ? item.value.toLocaleString()
            : item.value}
        </Typography>
      )}

      {showPercentages && item.percentage !== undefined && (
        <Typography
          variant="body2"
          sx={{
            color: item.hidden ? 'text.disabled' : 'text.secondary',
            minWidth: 50,
            textAlign: 'right',
          }}
        >
          {item.percentage.toFixed(1)}%
        </Typography>
      )}
    </Box>
  );

  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        p: 1.5,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      {(title || collapsible) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
            cursor: collapsible ? 'pointer' : 'default',
          }}
          onClick={collapsible ? handleExpand : undefined}
        >
          {collapsible && (
            <IconButton size="small" edge="start">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}

          {title && (
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              {title}
            </Typography>
          )}

          {interactive && (
            <Tooltip title="Legend Options">
              <IconButton size="small" edge="end">
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      <Collapse in={!collapsible || expanded}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: layout === 'horizontal' ? 'row' : 'column',
            flexWrap: layout === 'horizontal' ? 'wrap' : 'nowrap',
            gap: 1,
          }}
        >
          {displayedItems.map(renderLegendItem)}

          {hasMoreItems && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 0.5,
              }}
            >
              <Typography
                variant="body2"
                color="primary"
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
                onClick={handleShowMore}
              >
                {showAll
                  ? 'Show Less'
                  : `Show ${items.length - maxItems} More`}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

// Helper components for common legend variants
export const HorizontalLegend: React.FC<Omit<AnalyticsLegendProps, 'layout'>> = (props) => (
  <AnalyticsLegend {...props} layout="horizontal" />
);

export const CompactLegend: React.FC<Omit<AnalyticsLegendProps, 'showValues' | 'showPercentages'>> = (props) => (
  <AnalyticsLegend {...props} showValues={false} showPercentages={false} />
);

export const DetailedLegend: React.FC<Omit<AnalyticsLegendProps, 'showValues' | 'showPercentages'>> = (props) => (
  <AnalyticsLegend {...props} showValues={true} showPercentages={true} />
);

export default AnalyticsLegend;
