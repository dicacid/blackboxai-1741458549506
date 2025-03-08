import React, { useState } from 'react';
import {
  Box,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface GridItem {
  id: string;
  width?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  height?: number | string;
  minHeight?: number | string;
  draggable?: boolean;
  order?: number;
}

interface AnalyticsGridProps {
  className?: string;
  items: GridItem[];
  spacing?: number;
  container?: boolean;
  autoHeight?: boolean;
  draggable?: boolean;
  onItemMove?: (sourceId: string, targetId: string) => void;
  children?: React.ReactNode;
}

const DEFAULT_BREAKPOINTS = {
  xs: 12,
  sm: 6,
  md: 4,
  lg: 3,
};

const AnalyticsGrid: React.FC<AnalyticsGridProps> = ({
  className,
  items,
  spacing = 2,
  container = false,
  autoHeight = false,
  draggable = false,
  onItemMove,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItem(id);
    event.dataTransfer.setData('text/plain', id);
    event.currentTarget.style.opacity = '0.6';
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    setDraggedItem(null);
    event.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain');
    
    if (sourceId !== targetId && onItemMove) {
      onItemMove(sourceId, targetId);
    }
  };

  const renderGridItems = () => {
    const childrenArray = React.Children.toArray(children);

    return items.map((item, index) => {
      const child = childrenArray[index];
      if (!child) return null;

      const gridProps = {
        item: true,
        xs: item.width?.xs || DEFAULT_BREAKPOINTS.xs,
        sm: item.width?.sm || DEFAULT_BREAKPOINTS.sm,
        md: item.width?.md || DEFAULT_BREAKPOINTS.md,
        lg: item.width?.lg || DEFAULT_BREAKPOINTS.lg,
        order: item.order,
      };

      const content = (
        <Box
          sx={{
            height: item.height || (autoHeight ? 'auto' : '100%'),
            minHeight: item.minHeight,
            opacity: draggedItem === item.id ? 0.6 : 1,
            transition: theme.transitions.create(['opacity', 'transform']),
            transform: draggedItem === item.id ? 'scale(1.02)' : 'none',
            cursor: draggable && item.draggable ? 'move' : 'default',
            '&:hover': draggable && item.draggable ? {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[4],
            } : undefined,
          }}
        >
          {child}
        </Box>
      );

      if (!draggable || !item.draggable || isMobile) {
        return (
          <Grid key={item.id} {...gridProps}>
            {content}
          </Grid>
        );
      }

      return (
        <Grid
          key={item.id}
          {...gridProps}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          {content}
        </Grid>
      );
    });
  };

  return (
    <Box className={className}>
      <Grid
        container
        spacing={spacing}
        sx={{
          height: container ? '100%' : 'auto',
          width: container ? '100%' : 'auto',
          m: container ? 0 : -spacing,
        }}
      >
        {renderGridItems()}
      </Grid>
    </Box>
  );
};

// Helper components for common grid layouts
export const AnalyticsGridRow: React.FC<Omit<AnalyticsGridProps, 'container'>> = (props) => (
  <AnalyticsGrid {...props} container={false} />
);

export const AnalyticsGridContainer: React.FC<Omit<AnalyticsGridProps, 'container'>> = (props) => (
  <AnalyticsGrid {...props} container={true} />
);

export const AnalyticsDraggableGrid: React.FC<Omit<AnalyticsGridProps, 'draggable'>> = (props) => (
  <AnalyticsGrid {...props} draggable={true} />
);

export const AnalyticsAutoHeightGrid: React.FC<Omit<AnalyticsGridProps, 'autoHeight'>> = (props) => (
  <AnalyticsGrid {...props} autoHeight={true} />
);

export default AnalyticsGrid;
