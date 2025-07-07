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
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const EnrollmentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const statusMapping = ['all', 'active', 'completed', 'pending', 'cancelled'];
      const status = statusMapping[selectedTab];
      const params = {
        page,
        limit: 10,
        ...(status !== 'all' && { status }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await axios.get(`${API_BASE_URL}/enrollments`, { params });
      setEnrollments(response.data.enrollments);
      setTotalPages(response.data.pagination.totalPages);
      
      // Calculate stats
      const allEnrollmentsResponse = await axios.get(`${API_BASE_URL}/enrollments?limit=1000`);
      const allEnrollments = allEnrollmentsResponse.data.enrollments;
      
      setStats({
        total: allEnrollments.length,
        active: allEnrollments.filter(e => e.status === 'active').length,
        completed: allEnrollments.filter(e => e.status === 'completed').length,
        pending: allEnrollments.filter(e => e.status === 'pending').length,
        cancelled: allEnrollments.filter(e => e.status === 'cancelled').length,
      });
    } catch (error) {
      toast.error('Failed to fetch enrollments');
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTab, searchTerm, statusFilter, page]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setPage(1);
  };

  const handleMenuClick = (event, enrollment) => {
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

  const handleCancelEnrollment = () => {
    setCancelDialog(true);
    handleMenuClose();
  };

  const confirmCancelEnrollment = async () => {
    try {
      await axios.put(`/enrollments/${selectedEnrollment._id}/cancel`);
      toast.success('Enrollment cancelled successfully');
      fetchEnrollments();
      setCancelDialog(false);
    } catch (error) {
      toast.error('Failed to cancel enrollment');
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/enrollments/${selectedEnrollment._id}/certificate`,
        { responseType: 'blob' }
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchEnrollments}
              >
                Refresh
              </Button>
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

      {/* Enrollments Table/Grid */}
      {enrollments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No enrollments found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You haven't enrolled in any courses yet.
            </Typography>
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
                          {formatPrice(enrollment.payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, enrollment)}
                        >
                          <MoreVert />
                        </IconButton>
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
                      <IconButton
                        onClick={(e) => handleMenuClick(e, enrollment)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Enrolled: {formatDate(enrollment.enrollmentDate)}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {formatPrice(enrollment.payment.amount)}
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
        {selectedEnrollment?.status === 'completed' && 
         selectedEnrollment?.certificate?.issued && (
          <MenuItem onClick={handleDownloadCertificate}>
            <Download sx={{ mr: 1 }} />
            Download Certificate
          </MenuItem>
        )}
        {selectedEnrollment?.status === 'active' && (
          <MenuItem onClick={handleCancelEnrollment}>
            <Cancel sx={{ mr: 1 }} />
            Cancel Enrollment
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>Cancel Enrollment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your enrollment in "{selectedEnrollment?.course?.title}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. You may lose access to course materials.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
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
