import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
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
} from '@mui/material';
import {
  MoreVert,
  Edit,
  CheckCircle,
  Person,
  Payment,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import SearchAndFilter from '../../components/Common/SearchAndFilter';
import { formatPrice } from '../../utils/currency';

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    paidAmount: 0,
  });

  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'All Payment Status' },
    { value: 'pending', label: 'Payment Pending' },
    { value: 'completed', label: 'Payment Completed' },
    { value: 'failed', label: 'Payment Failed' },
    { value: 'refunded', label: 'Payment Refunded' },
  ];

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentStatusFilter !== 'all' && { paymentStatus: paymentStatusFilter }),
      };

      const config = {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${API_BASE_URL}/enrollments`, config);
      setEnrollments(response.data.enrollments || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
      // Calculate stats
      const allEnrollments = response.data.enrollments || [];
      const totalPaidAmount = allEnrollments
        .filter(e => e.payment?.paymentStatus === 'completed')
        .reduce((sum, e) => sum + (e.payment?.amount || 0), 0);

      setStats({
        total: allEnrollments.length,
        pending: allEnrollments.filter(e => e.status === 'pending').length,
        active: allEnrollments.filter(e => e.status === 'active').length,
        completed: allEnrollments.filter(e => e.status === 'completed').length,
        cancelled: allEnrollments.filter(e => e.status === 'cancelled').length,
        paidAmount: totalPaidAmount,
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleMenuClick = (event, enrollment) => {
    setAnchorEl(event.currentTarget);
    setSelectedEnrollment(enrollment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEnrollment(null);
  };

  const handleUpdateStatus = () => {
    setNewStatus(selectedEnrollment?.status || 'pending');
    setStatusUpdateDialog(true);
    handleMenuClose();
  };

  const confirmStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.put(`${API_BASE_URL}/enrollments/${selectedEnrollment._id}/status`, {
        status: newStatus,
        reason: 'Admin status update'
      }, config);

      toast.success('Enrollment status updated successfully');
      setStatusUpdateDialog(false);
      fetchEnrollments();
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      toast.error('Failed to update enrollment status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'refunded':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatStatsForDisplay = {
    total: stats.total,
    pending: stats.pending,
    active: stats.active,
    completed: stats.completed,
    cancelled: stats.cancelled,
    revenue: formatPrice(stats.paidAmount),
  };

  if (loading && enrollments.length === 0) {
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
        Enrollment Management
      </Typography>

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by student name, course title, or email..."
        filterOptions={statusOptions}
        selectedFilter={statusFilter}
        onFilterChange={setStatusFilter}
        filterLabel="Status"
        onRefresh={fetchEnrollments}
        loading={loading}
        stats={formatStatsForDisplay}
        additionalFilters={[
          {
            gridSize: 3,
            component: (
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label="Payment Status"
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  {paymentStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ),
            hasActiveValue: paymentStatusFilter !== 'all',
            onClear: () => setPaymentStatusFilter('all'),
            activeChip: paymentStatusFilter !== 'all' ? {
              label: `Payment: ${paymentStatusOptions.find(opt => opt.value === paymentStatusFilter)?.label}`,
              onDelete: () => setPaymentStatusFilter('all')
            } : null,
          }
        ]}
      />

      {/* Enrollments Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Enrolled Date</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {enrollment.student?.firstName} {enrollment.student?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {enrollment.student?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {enrollment.course?.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatPrice(enrollment.payment?.amount, enrollment.payment?.currency)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={enrollment.status}
                      color={getStatusColor(enrollment.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={enrollment.payment?.paymentStatus || 'pending'}
                      color={getPaymentStatusColor(enrollment.payment?.paymentStatus)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {enrollment.progress || 0}%
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, enrollment)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* No enrollments found */}
      {!loading && enrollments.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No enrollments found matching your criteria.
        </Alert>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleUpdateStatus}>
          <Edit sx={{ mr: 1 }} />
          Update Status
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <CheckCircle sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Payment sx={{ mr: 1 }} />
          View Payment
        </MenuItem>
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onClose={() => setStatusUpdateDialog(false)}>
        <DialogTitle>Update Enrollment Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateDialog(false)}>Cancel</Button>
          <Button onClick={confirmStatusUpdate} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminEnrollments; 