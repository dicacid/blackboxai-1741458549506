import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  ViewModule as GridIcon,
  ViewList as ListIcon,
  Sort as SortIcon,
  ViewColumn as ColumnsIcon,
  Search as SearchIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

interface ViewOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface SortOption {
  value: string;
  label: string;
}

interface ColumnOption {
  value: string;
  label: string;
  visible: boolean;
}

interface AnalyticsToolbarProps {
  className?: string;
  views?: ViewOption[];
  sortOptions?: SortOption[];
  columns?: ColumnOption[];
  onViewChange?: (view: string) => void;
  onSortChange?: (sort: string) => void;
  onColumnChange?: (columns: ColumnOption[]) => void;
  onSearch?: (query: string) => void;
  onExport?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  onFilterToggle?: () => void;
  filtersOpen?: boolean;
}

const AnalyticsToolbar: React.FC<AnalyticsToolbarProps> = ({
  className,
  views,
  sortOptions,
  columns,
  onViewChange,
  onSortChange,
  onColumnChange,
  onSearch,
  onExport,
  onPrint,
  onShare,
  onRefresh,
  onSettings,
  onFilterToggle,
  filtersOpen,
}) => {
  const theme = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [viewAnchor, setViewAnchor] = useState<null | HTMLElement>(null);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const [columnsAnchor, setColumnsAnchor] = useState<null | HTMLElement>(null);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleViewClick = (event: React.MouseEvent<HTMLElement>) => {
    setViewAnchor(event.currentTarget);
  };

  const handleViewClose = () => {
    setViewAnchor(null);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchor(null);
  };

  const handleColumnsClick = (event: React.MouseEvent<HTMLElement>) => {
    setColumnsAnchor(event.currentTarget);
  };

  const handleColumnsClose = () => {
    setColumnsAnchor(null);
  };

  const handleColumnToggle = (column: ColumnOption) => {
    if (!columns) return;
    const newColumns = columns.map(c => 
      c.value === column.value ? { ...c, visible: !c.visible } : c
    );
    onColumnChange?.(newColumns);
  };

  return (
    <Box
      className={className}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {onSearch && (
        <TextField
          size="small"
          placeholder="Search..."
          value={searchValue}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
          sx={{ minWidth: 200 }}
        />
      )}

      <Stack direction="row" spacing={1}>
        {views && views.length > 0 && (
          <>
            <Button
              size="small"
              startIcon={<GridIcon />}
              onClick={handleViewClick}
            >
              View
            </Button>
            <Menu
              anchorEl={viewAnchor}
              open={Boolean(viewAnchor)}
              onClose={handleViewClose}
            >
              {views.map((view) => (
                <MenuItem
                  key={view.value}
                  onClick={() => {
                    onViewChange?.(view.value);
                    handleViewClose();
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {view.icon}
                    {view.label}
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {sortOptions && sortOptions.length > 0 && (
          <>
            <Button
              size="small"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
            >
              Sort
            </Button>
            <Menu
              anchorEl={sortAnchor}
              open={Boolean(sortAnchor)}
              onClose={handleSortClose}
            >
              {sortOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  onClick={() => {
                    onSortChange?.(option.value);
                    handleSortClose();
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {columns && columns.length > 0 && (
          <>
            <Button
              size="small"
              startIcon={<ColumnsIcon />}
              onClick={handleColumnsClick}
            >
              Columns
            </Button>
            <Menu
              anchorEl={columnsAnchor}
              open={Boolean(columnsAnchor)}
              onClose={handleColumnsClose}
            >
              {columns.map((column) => (
                <MenuItem
                  key={column.value}
                  onClick={() => handleColumnToggle(column)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => {}}
                    />
                    {column.label}
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Stack direction="row" spacing={1}>
        {onFilterToggle && (
          <Tooltip title={filtersOpen ? 'Hide Filters' : 'Show Filters'}>
            <IconButton
              size="small"
              onClick={onFilterToggle}
              color={filtersOpen ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        )}

        {onExport && (
          <Tooltip title="Export">
            <IconButton size="small" onClick={onExport}>
              <ExportIcon />
            </IconButton>
          </Tooltip>
        )}

        {onPrint && (
          <Tooltip title="Print">
            <IconButton size="small" onClick={onPrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        )}

        {onShare && (
          <Tooltip title="Share">
            <IconButton size="small" onClick={onShare}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        )}

        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}

        {onSettings && (
          <Tooltip title="Settings">
            <IconButton size="small" onClick={onSettings}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};

export default AnalyticsToolbar;
