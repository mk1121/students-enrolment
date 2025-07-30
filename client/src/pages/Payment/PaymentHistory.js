import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Payment as PaymentIcon,
  FilterList as FilterIcon,
  School as SchoolIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import config from '../../config/api';
import { formatPrice } from '../../utils/currency';
import { toast } from 'react-toastify';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPayments, setTotalPayments] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
  });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
      });

      if (statusFilter) {
        queryParams.append('status', statusFilter);
      }

      const response = await fetch(
        `${config.API_BASE_URL}/payments/my-payments?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setTotalPayments(data.pagination?.total || 0);

      // Calculate stats
      const totalAmount = data.payments.reduce((sum, payment) => {
        return sum + (payment.status === 'completed' ? payment.amount : 0);
      }, 0);

      const completedCount = data.payments.filter(p => p.status === 'completed').length;
      const pendingCount = data.payments.filter(p => p.status === 'pending').length;

      setStats({
        totalAmount,
        totalTransactions: data.pagination?.total || 0,
        completedTransactions: completedCount,
        pendingTransactions: pendingCount,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payments/${paymentId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'stripe':
        return <CreditCardIcon />;
      case 'sslcommerz':
        return <BankIcon />;
      case 'cash':
        return <MoneyIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && payments.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={50} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Payment History
        </Typography>
        <Typography variant="h6" color="text.secondary">
          View and manage all your payment transactions
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Spent
                  </Typography>
                  <Typography variant="h5">
                    {formatPrice(stats.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PaymentIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Transactions
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalTransactions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ReceiptIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h5">
                    {stats.completedTransactions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <FilterIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h5">
                    {stats.pendingTransactions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box mb={3}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Payment Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {payments.length === 0 && !loading ? (
          <Box textAlign="center" py={8}>
            <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No payment history found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Your payment transactions will appear here once you make a purchase
            </Typography>
            <Button
              variant="contained"
              startIcon={<SchoolIcon />}
              onClick={() => navigate('/courses')}
            >
              Browse Courses
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            src={payment.course?.thumbnail}
                            sx={{ width: 40, height: 40 }}
                          >
                            <SchoolIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" noWrap>
                              {payment.course?.title || payment.metadata?.courseTitle || 'Course'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {payment.course?.category || 'Category'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {formatPrice(payment.amount, payment.currency)}
                          </Typography>
                          {payment.netAmount !== payment.amount && (
                            <Typography variant="caption" color="text.secondary">
                              Net: {formatPrice(payment.netAmount, payment.currency)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {payment.paymentMethod === 'sslcommerz' ? 'SSLCommerz' : payment.paymentMethod}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={getStatusColor(payment.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payment.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {payment.transactionId || payment.metadata?.sslTransactionId || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {payment.status === 'completed' && (
                            <Tooltip title="Download Receipt">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadReceipt(payment._id)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/payment/receipt/${payment._id}`)}
                            >
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalPayments}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={30} />
        </Box>
      )}
    </Container>
  );
};

export default PaymentHistory;