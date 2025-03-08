import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowRight as ExpandIcon,
} from '@mui/icons-material';

interface Column {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string | number;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
}

interface AnalyticsTableProps {
  className?: string;
  columns: Column[];
  data: any[];
  title?: string;
  subtitle?: string;
  selectable?: boolean;
  expandable?: boolean;
  pagination?: boolean;
  defaultSort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (column: string, value: any) => void;
  onSelect?: (selectedIds: string[]) => void;
  onExpand?: (id: string) => void;
  onRowClick?: (id: string) => void;
  renderExpanded?: (row: any) => React.ReactNode;
}

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({
  className,
  columns,
  data,
  title,
  subtitle,
  selectable = false,
  expandable = false,
  pagination = true,
  defaultSort,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  onSort,
  onFilter,
  onSelect,
  onExpand,
  onRowClick,
  renderExpanded,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortColumn, setSortColumn] = useState(defaultSort?.column);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSort?.direction || 'asc'
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hidden),
    [columns]
  );

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map((row) => row.id);
      setSelectedRows(newSelected);
      onSelect?.(newSelected);
    } else {
      setSelectedRows([]);
      onSelect?.([]);
    }
  };

  const handleSelectRow = (id: string) => {
    const selectedIndex = selectedRows.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = [
        ...selectedRows.slice(0, selectedIndex),
        ...selectedRows.slice(selectedIndex + 1),
      ];
    }

    setSelectedRows(newSelected);
    onSelect?.(newSelected);
  };

  const handleExpandRow = (id: string) => {
    const expandedIndex = expandedRows.indexOf(id);
    let newExpanded: string[] = [];

    if (expandedIndex === -1) {
      newExpanded = [...expandedRows, id];
    } else {
      newExpanded = [
        ...expandedRows.slice(0, expandedIndex),
        ...expandedRows.slice(expandedIndex + 1),
      ];
    }

    setExpandedRows(newExpanded);
    onExpand?.(id);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCellValue = (column: Column, value: any) => {
    if (value === null || value === undefined) return '-';
    return column.format ? column.format(value) : value;
  };

  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      {(title || subtitle) && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          {title && (
            <Typography variant="subtitle1" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedRows.length > 0 &&
                      selectedRows.length < data.length
                    }
                    checked={
                      data.length > 0 && selectedRows.length === data.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {expandable && <TableCell width={48} />}
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ width: column.width }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortColumn === column.id}
                        direction={
                          sortColumn === column.id ? sortDirection : 'asc'
                        }
                        onClick={() => handleSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                    {column.filterable && (
                      <IconButton
                        size="small"
                        onClick={() => onFilter?.(column.id, null)}
                      >
                        <FilterIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              ))}
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    hover
                    onClick={() => onRowClick?.(row.id)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRows.includes(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {expandable && (
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandRow(row.id);
                          }}
                          sx={{
                            transform: expandedRows.includes(row.id)
                              ? 'rotate(90deg)'
                              : 'none',
                            transition: theme.transitions.create('transform'),
                          }}
                        >
                          <ExpandIcon />
                        </IconButton>
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        {formatCellValue(column, row[column.id])}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Tooltip title="More actions">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle more actions
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  {expandable && expandedRows.includes(row.id) && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          visibleColumns.length +
                          (selectable ? 1 : 0) +
                          (expandable ? 1 : 0) +
                          1
                        }
                        sx={{ py: 0 }}
                      >
                        <Box sx={{ p: 2 }}>{renderExpanded?.(row)}</Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};

// Helper components for common table variants
export const SimpleTable: React.FC<Omit<AnalyticsTableProps, 'selectable' | 'expandable' | 'pagination'>> = (props) => (
  <AnalyticsTable {...props} selectable={false} expandable={false} pagination={false} />
);

export const SelectableTable: React.FC<Omit<AnalyticsTableProps, 'selectable'>> = (props) => (
  <AnalyticsTable {...props} selectable={true} />
);

export const ExpandableTable: React.FC<Omit<AnalyticsTableProps, 'expandable'>> = (props) => (
  <AnalyticsTable {...props} expandable={true} />
);

export const CompleteTable: React.FC<AnalyticsTableProps> = (props) => (
  <AnalyticsTable {...props} selectable={true} expandable={true} pagination={true} />
);

export default AnalyticsTable;
