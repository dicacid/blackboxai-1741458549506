import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  InputLabel,
  Checkbox,
  Slider,
  Button,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';

interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'checkbox' | 'range' | 'date';
  options?: Array<{
    value: string | number;
    label: string;
  }>;
  range?: {
    min: number;
    max: number;
    step?: number;
    unit?: string;
  };
}

interface FilterValue {
  id: string;
  value: any;
  operator?: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
}

interface SavedFilter {
  id: string;
  name: string;
  values: FilterValue[];
}

interface AnalyticsFiltersProps {
  className?: string;
  title?: string;
  options: FilterOption[];
  value?: FilterValue[];
  savedFilters?: SavedFilter[];
  showSearch?: boolean;
  showSave?: boolean;
  onChange?: (filters: FilterValue[]) => void;
  onSearch?: (query: string) => void;
  onSave?: (name: string, filters: FilterValue[]) => void;
  onLoad?: (filter: SavedFilter) => void;
  onDelete?: (filterId: string) => void;
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  className,
  title = 'Filters',
  options,
  value = [],
  savedFilters = [],
  showSearch = true,
  showSave = true,
  onChange,
  onSearch,
  onSave,
  onLoad,
  onDelete,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>(value);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleFilterChange = (filter: FilterValue) => {
    const newFilters = activeFilters.map(f =>
      f.id === filter.id ? filter : f
    );
    setActiveFilters(newFilters);
    onChange?.(newFilters);
  };

  const handleAddFilter = (option: FilterOption) => {
    const newFilter: FilterValue = {
      id: option.id,
      value: option.type === 'range' ? [option.range?.min || 0, option.range?.max || 100] : '',
      operator: 'equals',
    };
    setActiveFilters([...activeFilters, newFilter]);
    onChange?.([...activeFilters, newFilter]);
  };

  const handleRemoveFilter = (id: string) => {
    const newFilters = activeFilters.filter(f => f.id !== id);
    setActiveFilters(newFilters);
    onChange?.(newFilters);
  };

  const handleClearAll = () => {
    setActiveFilters([]);
    onChange?.([]);
  };

  const handleSaveFilter = () => {
    if (filterName && onSave) {
      onSave(filterName, activeFilters);
      setSaveDialogOpen(false);
      setFilterName('');
    }
  };

  const renderFilterInput = (option: FilterOption, filter: FilterValue) => {
    switch (option.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            size="small"
            value={filter.value}
            onChange={(e) => handleFilterChange({ ...filter, value: e.target.value })}
            placeholder={`Filter by ${option.label.toLowerCase()}`}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{option.label}</InputLabel>
            <Select
              value={filter.value}
              onChange={(e) => handleFilterChange({ ...filter, value: e.target.value })}
            >
              {option.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{option.label}</InputLabel>
            <Select
              multiple
              value={filter.value || []}
              onChange={(e) => handleFilterChange({ ...filter, value: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip
                      key={value}
                      label={option.options?.find(opt => opt.value === value)?.label}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {option.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Checkbox checked={(filter.value || []).includes(opt.value)} />
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={filter.value}
                onChange={(e) => handleFilterChange({ ...filter, value: e.target.checked })}
              />
            }
            label={option.label}
          />
        );

      case 'range':
        return (
          <Box sx={{ px: 2 }}>
            <Slider
              value={filter.value || [option.range?.min || 0, option.range?.max || 100]}
              onChange={(_, value) => handleFilterChange({ ...filter, value })}
              valueLabelDisplay="auto"
              min={option.range?.min}
              max={option.range?.max}
              step={option.range?.step}
              valueLabelFormat={(value) => 
                `${value}${option.range?.unit ? ` ${option.range.unit}` : ''}`
              }
            />
          </Box>
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            size="small"
            value={filter.value}
            onChange={(e) => handleFilterChange({ ...filter, value: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        );

      default:
        return null;
    }
  };

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
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: showSearch ? 2 : 0 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Tooltip title="Clear all filters">
            <IconButton
              size="small"
              onClick={handleClearAll}
              disabled={activeFilters.length === 0}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {showSearch && (
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search..."
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {options.map((option) => {
          const filter = activeFilters.find(f => f.id === option.id);
          return filter ? (
            <Box key={option.id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {option.label}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFilter(option.id)}
                  sx={{ ml: 'auto' }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Box>
              {renderFilterInput(option, filter)}
            </Box>
          ) : null;
        })}

        {options.length > activeFilters.length && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              const unusedOption = options.find(
                opt => !activeFilters.some(f => f.id === opt.id)
              );
              if (unusedOption) {
                handleAddFilter(unusedOption);
              }
            }}
          >
            Add Filter
          </Button>
        )}
      </Box>

      {(showSave || savedFilters.length > 0) && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            {savedFilters.length > 0 && (
              <Box sx={{ mb: showSave ? 2 : 0 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Saved Filters
                </Typography>
                {savedFilters.map((filter) => (
                  <Box
                    key={filter.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 0.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                      onClick={() => onLoad?.(filter)}
                    >
                      {filter.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onDelete?.(filter.id)}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {showSave && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => setSaveDialogOpen(true)}
                disabled={activeFilters.length === 0}
              >
                Save Filter
              </Button>
            )}
          </Box>
        </>
      )}

      {saveDialogOpen && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Filter name"
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSaveFilter}
              disabled={!filterName}
            >
              Save
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// Helper components for common filter variants
export const SimpleFilters: React.FC<Omit<AnalyticsFiltersProps, 'showSearch' | 'showSave'>> = (props) => (
  <AnalyticsFilters {...props} showSearch={false} showSave={false} />
);

export const SearchableFilters: React.FC<Omit<AnalyticsFiltersProps, 'showSearch'>> = (props) => (
  <AnalyticsFilters {...props} showSearch={true} />
);

export const SaveableFilters: React.FC<Omit<AnalyticsFiltersProps, 'showSave'>> = (props) => (
  <AnalyticsFilters {...props} showSave={true} />
);

export const CompleteFilters: React.FC<AnalyticsFiltersProps> = (props) => (
  <AnalyticsFilters {...props} showSearch={true} showSave={true} />
);

export default AnalyticsFilters;
