import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import {
  Search,
  Refresh,
  Clear,
} from '@mui/icons-material';

/**
 * Reusable SearchAndFilter component for consistent search functionality across pages
 * 
 * @param {Object} props
 * @param {string} props.searchTerm - Current search term
 * @param {function} props.onSearchChange - Callback for search term changes
 * @param {Array} props.filterOptions - Array of filter options [{ value, label, count? }]
 * @param {string} props.selectedFilter - Currently selected filter value
 * @param {function} props.onFilterChange - Callback for filter changes
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {string} props.filterLabel - Label for filter dropdown
 * @param {function} props.onRefresh - Callback for refresh button
 * @param {boolean} props.loading - Loading state
 * @param {Array} props.additionalFilters - Additional filter components
 * @param {Object} props.stats - Statistics to display as chips
 */
const SearchAndFilter = ({
  searchTerm = '',
  onSearchChange,
  filterOptions = [],
  selectedFilter = 'all',
  onFilterChange,
  searchPlaceholder = 'Search...',
  filterLabel = 'Filter',
  onRefresh,
  loading = false,
  additionalFilters = [],
  stats = null,
  showClearButton = true,
}) => {
  const handleClearFilters = () => {
    onSearchChange('');
    onFilterChange('all');
    // Clear additional filters if they have clear methods
    additionalFilters.forEach(filter => {
      if (filter.onClear) {
        filter.onClear();
      }
    });
  };

  const hasActiveFilters = searchTerm || selectedFilter !== 'all' || 
    additionalFilters.some(filter => filter.hasActiveValue);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Statistics Chips */}
        {stats && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={1}>
              {Object.entries(stats).map(([key, value]) => (
                <Grid item key={key}>
                  <Chip
                    label={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Search and Filter Controls */}
        <Grid container spacing={3} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Main Filter Dropdown */}
          {filterOptions.length > 0 && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{filterLabel}</InputLabel>
                <Select
                  value={selectedFilter}
                  label={filterLabel}
                  onChange={(e) => onFilterChange(e.target.value)}
                >
                  {filterOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                      {option.count !== undefined && ` (${option.count})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Additional Filter Components */}
          {additionalFilters.map((filter, index) => (
            <Grid item xs={12} md={filter.gridSize || 2} key={index}>
              {filter.component}
            </Grid>
          ))}

          {/* Action Buttons */}
          <Grid item xs={12} md={2}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Grid>
              {showClearButton && hasActiveFilters && (
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<Clear />}
                    onClick={handleClearFilters}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {searchTerm && (
                <Chip
                  label={`Search: "${searchTerm}"`}
                  onDelete={() => onSearchChange('')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {selectedFilter !== 'all' && (
                <Chip
                  label={`${filterLabel}: ${filterOptions.find(opt => opt.value === selectedFilter)?.label || selectedFilter}`}
                  onDelete={() => onFilterChange('all')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {additionalFilters.map((filter, index) => 
                filter.activeChip && (
                  <Chip
                    key={index}
                    {...filter.activeChip}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchAndFilter;
