import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Rating,
  CircularProgress,
  Alert,
  Paper,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Search,
  FilterList,
  Schedule,
  Group,
  Star,
  ExpandMore,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import config from '../config/api';
import { formatPrice } from '../utils/currency';

const Courses = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt-desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setSearching(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on search
      setSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  const categories = [
    'Programming',
    'Design',
    'Business',
    'Marketing',
    'Finance',
    'Health',
    'Language',
    'Music',
    'Photography',
    'Other',
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating-desc', label: 'Highest Rated' },
    { value: 'currentStudents-desc', label: 'Most Popular' },
  ];

  useEffect(() => {
    fetchCourses();
  }, [debouncedSearchTerm, category, level, priceRange, sortBy, page]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
    if (category) params.set('category', category);
    if (level) params.set('level', level);
    if (sortBy !== 'createdAt-desc') params.set('sortBy', sortBy);
    if (page !== 1) params.set('page', page.toString());
    
    setSearchParams(params);
  }, [debouncedSearchTerm, category, level, sortBy, page, setSearchParams]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      // Parse sortBy to get field and order
      const [sortField, sortOrder] = sortBy.split('-');
      params.append('sortBy', sortField);
      params.append('sortOrder', sortOrder);

      if (debouncedSearchTerm.trim()) params.append('search', debouncedSearchTerm.trim());
      if (category) params.append('category', category);
      if (level) params.append('level', level);
      if (priceRange[0] > 0) params.append('minPrice', priceRange[0].toString());
      if (priceRange[1] < 50000) params.append('maxPrice', priceRange[1].toString());

      const response = await fetch(`${config.API_BASE_URL}/courses?${params}`, {
        headers: {
          'Authorization': isAuthenticated ? `Bearer ${localStorage.getItem('token')}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCourses(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message);
      setCourses([]);
      setTotalPages(1);
      setTotalCourses(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm);
    setPage(1);
  };

  const handleFilterReset = () => {
    setSearchTerm('');
    setCategory('');
    setLevel('');
    setPriceRange([0, 50000]);
    setSortBy('createdAt-desc');
    setPage(1);
  };

  const formatDuration = (hours) => {
    if (!hours || isNaN(hours) || hours <= 0) {
      return 'N/A';
    }
    
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours}h`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Courses
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and enroll in courses to advance your skills
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Filters</Typography>
              <Button size="small" onClick={handleFilterReset}>
                Reset
              </Button>
            </Box>

            {/* Search */}
            <Box component="form" onSubmit={handleSearchSubmit} mb={3}>
              <TextField
                fullWidth
                placeholder="Search courses by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searching && (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ),
                }}
              />
              {searchTerm && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {searching ? 'Searching...' : 'Press Enter to search or wait for auto-search'}
                </Typography>
              )}
            </Box>

            {/* Category Filter */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Level Filter */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={level}
                label="Level"
                onChange={(e) => {
                  setLevel(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Levels</MenuItem>
                {levels.map((lvl) => (
                  <MenuItem key={lvl} value={lvl}>
                    {lvl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Price Range */}
            <Box mb={3}>
              <Typography gutterBottom>Price Range</Typography>
              <Slider
                value={priceRange}
                onChange={(e, newValue) => setPriceRange(newValue)}
                onChangeCommitted={() => setPage(1)}
                valueLabelDisplay="auto"
                min={0}
                max={50000}
                step={100}
                valueLabelFormat={(value) => `৳${value.toLocaleString('en-BD')}`}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">৳{priceRange[0].toLocaleString('en-BD')}</Typography>
                <Typography variant="body2">৳{priceRange[1].toLocaleString('en-BD')}</Typography>
              </Box>
            </Box>

            {/* Sort */}
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Results Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h6">
              {loading ? 'Loading...' : 
               searching ? 'Searching...' : 
               `${totalCourses} course${totalCourses !== 1 ? 's' : ''} found`}
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ display: { md: 'none' } }}
            >
              Filters
            </Button>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {/* Course Grid */}
          {!loading && courses.length > 0 && (
            <>
              <Grid container spacing={3}>
                {courses.map((course) => (
                  <Grid item xs={12} sm={6} lg={4} key={course._id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      {course.thumbnail && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={course.thumbnail}
                          alt={course.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip label={course.category} size="small" color="primary" />
                          <Chip label={course.level} size="small" variant="outlined" />
                          {course.isFeatured && (
                            <Chip label="Featured" size="small" color="secondary" />
                          )}
                        </Box>

                        <Typography variant="h6" component="h2" gutterBottom
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}>
                          {course.title}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" paragraph
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}>
                          {course.shortDescription || course.description}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Person fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            {course.instructor?.name || 'Instructor'}
                          </Typography>
                        </Box>

                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Rating value={course.rating?.average || 0} readOnly size="small" />
                            <Typography variant="body2">
                              ({course.rating?.count || 0})
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Group fontSize="small" />
                            <Typography variant="body2">
                              {course.currentStudents || 0}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Schedule fontSize="small" />
                            <Typography variant="body2">
                              {formatDuration(course.duration)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center" justifyContent="space-between" mt="auto">
                          <Box>
                            {course.discount > 0 ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="h6" color="primary">
                                  {formatPrice(course.discountedPrice || course.price, course.currency || 'BDT')}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ textDecoration: 'line-through' }}
                                  color="text.secondary"
                                >
                                  {formatPrice(course.price, course.currency || 'BDT')}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="h6" color="primary">
                                {formatPrice(course.price, course.currency || 'BDT')}
                              </Typography>
                            )}
                          </Box>

                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/courses/${course._id}`);
                            }}
                          >
                            View Course
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}

          {/* No Results */}
          {!loading && courses.length === 0 && !error && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No courses found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Try adjusting your search criteria or filters
              </Typography>
              <Button variant="contained" onClick={handleFilterReset}>
                Clear Filters
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Courses; 