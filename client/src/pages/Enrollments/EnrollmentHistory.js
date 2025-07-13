import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Pagination,
} from '@mui/material';
import {
  PlayCircle,
  MoreVert,
  Download,
  Cancel,
  Refresh,
  Search,
  School,
  Schedule,
  CheckCircle,
  ErrorOutline,
  AccessTime,
  ShoppingCart,
  Receipt,
} from '@mui/icons-material';
import { formatPrice } from '../../utils/currency';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const EnrollmentHistory = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  });

  const tabLabels = ['All', 'Active', 'Completed', 'Pending', 'Cancelled'];
  const statusMapping = ['all', 'active', 'completed', 'pending', 'cancelled'];

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const statusMapping = ['all', 'active', 'completed', 'pending', 'cancelled'];
      
      // Determine which status to use - prioritize statusFilter over tab selection
      let effectiveStatus = statusFilter;
      if (statusFilter === 'all') {
        effectiveStatus = statusMapping[selectedTab];
      }
      
      const params = {
        page,
        limit: 10,
        ...(effectiveStatus !== 'all' && { status: effectiveStatus }),
        ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
        sortBy: 'enrollmentDate',
        sortOrder: 'desc'
      };

      const token = localStorage.getItem('token');
      const config = {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${API_BASE_URL}/enrollments/my-enrollments`, config);
      console.log('Enrollments API response:', response.data);
      console.log('First enrollment structure:', response.data.enrollments?.[0]);
      
      setEnrollments(response.data.enrollments || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
      // Use stats from backend response
      if (response.data.stats) {
        setStats(response.data.stats);
      } else {
        // Fallback stats calculation if backend doesn't provide them
        const allEnrollments = response.data.enrollments || [];
        setStats({
          total: allEnrollments.length,
          active: allEnrollments.filter(e => e.status === 'active').length,
          completed: allEnrollments.filter(e => e.status === 'completed').length,
          pending: allEnrollments.filter(e => e.status === 'pending').length,
          cancelled: allEnrollments.filter(e => e.status === 'cancelled').length,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch enrollments');
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTab, searchTerm, statusFilter, page]);

  useEffect(() => {
    // Initial load
    fetchEnrollments();
  }, [fetchEnrollments, selectedTab, statusFilter]); // Only trigger on tab or status filter change

  // Debounced search effect
  useEffect(() => {
    if (searchTerm === '') {
      // If search is cleared, fetch immediately
      fetchEnrollments();
      return;
    }

    const timeoutId = setTimeout(() => {
      setPage(1); // Reset to first page when searching
      fetchEnrollments();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchEnrollments, searchTerm]); // Only depend on searchTerm

  // Page change effect
  useEffect(() => {
    if (page > 1) { // Only fetch if not on first page (first page is handled by other effects)
      fetchEnrollments();
    }
  }, [fetchEnrollments, page]);

  // Test backend connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        await axios.get(`${API_BASE_URL}/enrollments/my-enrollments`, config);
        console.log('✅ Backend connection successful');
      } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        if (error.code === 'ERR_NETWORK' || !error.response) {
          toast.error('Cannot connect to server. Please ensure the backend is running at http://localhost:5001');
        }
      }
    };
    
    testConnection();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setPage(1);
    // Reset status filter when tab changes
    setStatusFilter('all');
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
    // Don't change tab when status filter changes
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedTab(0);
    setPage(1);
  };

  const handleMenuClick = (event, enrollment) => {
    console.log('Menu clicked for enrollment:', enrollment);
    console.log('Enrollment ID:', enrollment?._id);
    console.log('Course title:', enrollment?.course?.title);
    setAnchorEl(event.currentTarget);
    setSelectedEnrollment(enrollment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEnrollment(null);
  };

  const handleViewCourse = () => {
    if (selectedEnrollment) {
      navigate(`/courses/${selectedEnrollment.course._id}/learn`);
    }
    handleMenuClose();
  };

  const handleGoToCheckout = () => {
    if (selectedEnrollment) {
      navigate(`/checkout/${selectedEnrollment._id}`);
    }
    handleMenuClose();
  };

  const handleViewReceipt = () => {
    if (selectedEnrollment) {
      // Navigate to receipt page using enrollment ID
      navigate(`/payment/receipt/enrollment/${selectedEnrollment._id}`);
    }
    handleMenuClose();
  };

  const handleCancelEnrollment = () => {
    setCancelDialog(true);
    // Don't close menu here - keep selectedEnrollment available for the confirmation
  };

  const confirmCancelEnrollment = async () => {
    try {
      // Safety check: ensure selectedEnrollment exists
      if (!selectedEnrollment || !selectedEnrollment._id) {
        console.error('No enrollment selected or missing enrollment ID');
        console.error('selectedEnrollment:', selectedEnrollment);
        toast.error('No enrollment selected. Please try again.');
        setCancelDialog(false);
        handleMenuClose();
        return;
      }
      
      // Validate enrollment ID format (MongoDB ObjectId is 24 hex characters)
      const enrollmentId = selectedEnrollment._id;
      if (!/^[0-9a-fA-F]{24}$/.test(enrollmentId)) {
        console.error('Invalid enrollment ID format:', enrollmentId);
        toast.error('Invalid enrollment ID. Please refresh the page and try again.');
        setCancelDialog(false);
        handleMenuClose();
        return;
      }

      console.log('Cancelling enrollment:', enrollmentId);
      console.log('Enrollment object:', selectedEnrollment);
      console.log('Making request to:', `${API_BASE_URL}/enrollments/${enrollmentId}/status`);
      
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      console.log('Full API_BASE_URL:', API_BASE_URL);
      
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }
      
      // Create axios config with auth header
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Test if we can reach the API with auth
      try {
        const testResponse = await axios.get(`${API_BASE_URL}/enrollments/my-enrollments`, config);
        console.log('API connection test successful, got', testResponse.data?.enrollments?.length || 0, 'enrollments');
      } catch (testError) {
        console.error('API connection test failed:', testError.message);
        if (testError.response?.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else {
          toast.error('Cannot connect to server. Please check if the backend is running.');
        }
        return;
      }
      
      const requestBody = {
        status: 'cancelled',
        reason: 'User requested cancellation'
      };
      
      console.log('Request body:', requestBody);
      console.log('Request config:', config);
      
      const response = await axios.put(`${API_BASE_URL}/enrollments/${enrollmentId}/status`, requestBody, config);
      
      console.log('Cancel response:', response.data);
      toast.success('Enrollment cancelled successfully');
      fetchEnrollments();
      setCancelDialog(false);
      handleMenuClose(); // Close menu after successful cancellation
    } catch (error) {
      console.error('Error cancelling enrollment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error code:', error.code);
      
      let errorMessage;
      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error: Cannot reach the server. Please check if the backend is running on http://localhost:5001';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check the server configuration.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You can only cancel your own enrollments.';
      } else {
        errorMessage = error.response?.data?.message || 
                      error.response?.data?.error ||
                      `Failed to cancel enrollment (${error.response?.status || error.message || 'Network Error'})`;
      }
      
      toast.error(errorMessage);
      setCancelDialog(false);
      handleMenuClose(); // Close menu after error
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(
        `${API_BASE_URL}/enrollments/${selectedEnrollment._id}/certificate`,
        config
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${selectedEnrollment.course.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'refunded':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <PlayCircle color="success" />;
      case 'completed':
        return <CheckCircle color="primary" />;
      case 'pending':
        return <AccessTime color="warning" />;
      case 'cancelled':
        return <ErrorOutline color="error" />;
      default:
        return <Schedule color="action" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && enrollments.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          My Enrollments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your course progress and manage your enrollments
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PlayCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.active}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.completed}</Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTime color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.pending}</Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ErrorOutline color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{stats.cancelled}</Typography>
              <Typography variant="body2" color="text.secondary">
                Cancelled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search courses..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchEnrollments}
                  sx={{ minWidth: 'auto', px: 1 }}
                  title="Refresh"
                >
                  Refresh
                </Button>
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleClearFilters}
                    sx={{ minWidth: 'auto', px: 1 }}
                    title="Clear Filters"
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((label, index) => (
            <Tab
              key={label}
              label={`${label} (${index === 0 ? stats.total : stats[statusMapping[index]]})`}
            />
          ))}
        </Tabs>
      </Card>

      {/* Search Results Info */}
      {(searchTerm || statusFilter !== 'all') && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {searchTerm && statusFilter !== 'all' 
            ? `Showing results for "${searchTerm}" with status "${statusFilter}"`
            : searchTerm 
            ? `Showing results for "${searchTerm}"`
            : `Showing enrollments with status "${statusFilter}"`}
          {enrollments.length > 0 && ` (${enrollments.length} found)`}
        </Alert>
      )}

      {/* Enrollments Table/Grid */}
      {enrollments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm || statusFilter !== 'all' ? 'No matching enrollments found' : 'No enrollments found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search terms or filters.'
                : 'You haven\'t enrolled in any courses yet.'}
            </Typography>
            {searchTerm || statusFilter !== 'all' ? (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ mr: 1 }}
              >
                Clear Filters
              </Button>
            ) : null}
            <Button
              variant="contained"
              onClick={() => navigate('/courses')}
            >
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Enrolled Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <img
                            src={enrollment.course.thumbnail || '/placeholder-course.jpg'}
                            alt={enrollment.course.title}
                            style={{
                              width: 60,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 4,
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle2">
                              {enrollment.course.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {enrollment.course.category}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={enrollment.status}
                          color={getStatusColor(enrollment.status)}
                          size="small"
                          icon={getStatusIcon(enrollment.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 120 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={enrollment.progress || 0}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">
                              {enrollment.progress || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(enrollment.enrollmentDate)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary">
                          {formatPrice(enrollment.payment?.amount, enrollment.payment?.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {enrollment.payment?.paymentStatus === 'pending' ? (
                          <Box display="flex" gap={1}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<ShoppingCart />}
                              onClick={() => navigate(`/checkout/${enrollment._id}`)}
                            >
                              Pay Now
                            </Button>
                            <IconButton
                              onClick={(e) => handleMenuClick(e, enrollment)}
                              size="small"
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                        ) : enrollment.payment?.paymentStatus === 'completed' ? (
                          <Box display="flex" gap={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Receipt />}
                              onClick={() => navigate(`/payment/receipt/enrollment/${enrollment._id}`)}
                            >
                              View Receipt
                            </Button>
                            <IconButton
                              onClick={(e) => handleMenuClick(e, enrollment)}
                              size="small"
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton
                            onClick={(e) => handleMenuClick(e, enrollment)}
                          >
                            <MoreVert />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Mobile Card View */}
          <Grid container spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {enrollments.map((enrollment) => (
              <Grid item xs={12} key={enrollment._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <img
                        src={enrollment.course.thumbnail || '/placeholder-course.jpg'}
                        alt={enrollment.course.title}
                        style={{
                          width: 80,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                      <Box flex={1}>
                        <Typography variant="subtitle1" gutterBottom>
                          {enrollment.course.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip
                            label={enrollment.status}
                            color={getStatusColor(enrollment.status)}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {enrollment.course.category}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={enrollment.progress || 0}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {enrollment.progress || 0}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        {enrollment.payment?.paymentStatus === 'pending' && 
                         enrollment.payment?.amount > 0 && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ShoppingCart />}
                            onClick={() => navigate(`/checkout/${enrollment._id}`)}
                          >
                            Pay Now
                          </Button>
                        )}
                        {enrollment.payment && 
                         enrollment.payment?.paymentStatus === 'completed' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Receipt />}
                            onClick={() => navigate(`/payment/receipt/enrollment/${enrollment._id}`)}
                          >
                            View Receipt
                          </Button>
                        )}
                        <IconButton
                          onClick={(e) => handleMenuClick(e, enrollment)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Enrolled: {formatDate(enrollment.enrollmentDate)}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {formatPrice(enrollment.payment?.amount, enrollment.payment?.currency)}
                      </Typography>
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
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewCourse}>
          <PlayCircle sx={{ mr: 1 }} />
          View Course
        </MenuItem>
        {selectedEnrollment?.payment?.paymentStatus === 'pending' && 
         selectedEnrollment?.payment?.amount > 0 && (
          <MenuItem onClick={handleGoToCheckout}>
            <ShoppingCart sx={{ mr: 1 }} />
            Complete Payment
          </MenuItem>
        )}
        {selectedEnrollment?.payment && 
         selectedEnrollment?.payment?.paymentStatus === 'completed' && (
          <MenuItem onClick={handleViewReceipt}>
            <Receipt sx={{ mr: 1 }} />
            View Receipt
          </MenuItem>
        )}
        {selectedEnrollment?.status === 'completed' && 
         selectedEnrollment?.certificate?.issued && (
          <MenuItem onClick={handleDownloadCertificate}>
            <Download sx={{ mr: 1 }} />
            Download Certificate
          </MenuItem>
        )}
        {(selectedEnrollment?.status === 'active' || selectedEnrollment?.status === 'pending') && (
          <MenuItem onClick={handleCancelEnrollment}>
            <Cancel sx={{ mr: 1 }} />
            Cancel Enrollment
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog} onClose={() => { setCancelDialog(false); handleMenuClose(); }}>
        <DialogTitle>Cancel Enrollment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your enrollment in "{selectedEnrollment?.course?.title || 'this course'}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. You may lose access to course materials.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCancelDialog(false); handleMenuClose(); }}>
            Keep Enrollment
          </Button>
          <Button
            onClick={confirmCancelEnrollment}
            variant="contained"
            color="error"
          >
            Cancel Enrollment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EnrollmentHistory;
