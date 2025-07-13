import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  Rating,
  Avatar,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Group,
  TrendingUp,
  School,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import SearchAndFilter from '../../components/Common/SearchAndFilter';
import { formatPrice } from '../../utils/currency';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' },
    { value: 'marketing', label: 'Marketing' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ];

  const levelOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(levelFilter !== 'all' && { level: levelFilter }),
      };

      const config = {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${API_BASE_URL}/courses`, config);
      setCourses(response.data.courses || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
      // Calculate stats
      const allCourses = response.data.courses || [];
      const totalStudents = allCourses.reduce((sum, course) => sum + (course.currentStudents || 0), 0);
      const totalRevenue = allCourses.reduce((sum, course) => sum + ((course.price || 0) * (course.currentStudents || 0)), 0);
      const averageRating = allCourses.length > 0 
        ? allCourses.reduce((sum, course) => sum + (course.rating?.average || 0), 0) / allCourses.length 
        : 0;

      setStats({
        total: allCourses.length,
        published: allCourses.filter(c => c.status === 'published').length,
        draft: allCourses.filter(c => c.status === 'draft').length,
        totalStudents,
        totalRevenue,
        averageRating: averageRating.toFixed(1),
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, categoryFilter, statusFilter, levelFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleMenuClick = (event, course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const handleToggleStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const newStatus = selectedCourse.status === 'published' ? 'draft' : 'published';
      await axios.put(`${API_BASE_URL}/courses/${selectedCourse._id}`, {
        status: newStatus
      }, config);

      toast.success(`Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course status:', error);
      toast.error('Failed to update course status');
    }
    handleMenuClose();
  };

  const handleDeleteCourse = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.delete(`${API_BASE_URL}/courses/${selectedCourse._id}`, config);
      toast.success('Course deleted successfully');
      setDeleteDialog(false);
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatStatsForDisplay = {
    total: stats.total,
    published: stats.published,
    draft: stats.draft,
    students: stats.totalStudents,
    revenue: formatPrice(stats.totalRevenue),
    rating: `${stats.averageRating}★`,
  };

  if (loading && courses.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Course Management
      </Typography>

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search courses by title, description, or instructor..."
        filterOptions={categoryOptions}
        selectedFilter={categoryFilter}
        onFilterChange={setCategoryFilter}
        filterLabel="Category"
        onRefresh={fetchCourses}
        loading={loading}
        stats={formatStatsForDisplay}
        additionalFilters={[
          {
            gridSize: 2,
            component: (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ),
            hasActiveValue: statusFilter !== 'all',
            onClear: () => setStatusFilter('all'),
            activeChip: statusFilter !== 'all' ? {
              label: `Status: ${statusOptions.find(opt => opt.value === statusFilter)?.label}`,
              onDelete: () => setStatusFilter('all')
            } : null,
          },
          {
            gridSize: 2,
            component: (
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={levelFilter}
                  label="Level"
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  {levelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ),
            hasActiveValue: levelFilter !== 'all',
            onClear: () => setLevelFilter('all'),
            activeChip: levelFilter !== 'all' ? {
              label: `Level: ${levelOptions.find(opt => opt.value === levelFilter)?.label}`,
              onDelete: () => setLevelFilter('all')
            } : null,
          }
        ]}
      />

      {/* Courses Grid */}
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {course.thumbnail && (
                <CardMedia
                  component="img"
                  height="200"
                  image={course.thumbnail}
                  alt={course.title}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    {course.title}
                  </Typography>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, course)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {course.description?.substring(0, 100)}...
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={course.status}
                    color={getStatusColor(course.status)}
                    size="small"
                  />
                  <Chip
                    label={course.level}
                    color={getLevelColor(course.level)}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h6" color="primary">
                    {formatPrice(course.price)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Group fontSize="small" />
                    <Typography variant="body2">
                      {course.currentStudents || 0}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <School fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {course.instructor?.firstName} {course.instructor?.lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating 
                      value={course.rating?.average || 0} 
                      readOnly 
                      size="small" 
                      precision={0.1}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({course.rating?.count || 0})
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* No courses found */}
      {!loading && courses.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No courses found matching your criteria.
        </Alert>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit Course
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedCourse?.status === 'published' ? (
            <>
              <VisibilityOff sx={{ mr: 1 }} />
              Unpublish
            </>
          ) : (
            <>
              <Visibility sx={{ mr: 1 }} />
              Publish
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <TrendingUp sx={{ mr: 1 }} />
          View Analytics
        </MenuItem>
        <MenuItem onClick={handleDeleteCourse} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Course
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCourse?.title}"? 
            This action cannot be undone and will affect all enrolled students.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete Course
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCourses; 