import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download,
  Print,
  CheckCircle,
  ArrowBack,
  School,
  Person,
  Email,
  Phone,
  Visibility,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { formatPrice } from '../../utils/currency';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const PaymentReceipt = () => {
  const { paymentId, type, id } = useParams();
  const navigate = useNavigate();
  const { user, token, loading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        
        let apiUrl;
        let currentPaymentId = paymentId;
        
        if (type === 'stripe' && id) {
          // Handle /payment/receipt/stripe/:paymentIntentId
          apiUrl = `${API_BASE_URL}/payments/stripe/${id}`;
          currentPaymentId = id;
        } else if (type === 'enrollment' && id) {
          // Handle /payment/receipt/enrollment/:enrollmentId
          apiUrl = `${API_BASE_URL}/payments/enrollment/${id}`;
          currentPaymentId = id;
        } else if (paymentId) {
          // Handle /payment/receipt/:paymentId
          apiUrl = `${API_BASE_URL}/payments/${paymentId}`;
          currentPaymentId = paymentId;
        } else {
          throw new Error('Invalid payment identifier');
        }
        
        console.log('Fetching payment with ID:', currentPaymentId);
        console.log('User authenticated:', isAuthenticated);
        console.log('User:', user);
        
        // Ensure we have a token for authorization
        const authToken = token || localStorage.getItem('token');
        if (!authToken) {
          console.log('No auth token found');
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }

        console.log('Making API call to:', apiUrl);
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        console.log('Payment response:', response.data);
        setPayment(response.data.payment);
      } catch (error) {
        console.error('Error fetching payment:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        let errorMessage = 'Failed to load payment details';
        
        if (error.response?.status === 403) {
          errorMessage = 'Access denied. You can only view your own payments.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Payment not found. Please check the payment ID.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Simplified condition check - wait for auth to complete, then proceed
    if (authLoading) {
      console.log('Waiting for auth to complete...');
      return;
    }

    // Check if we have a valid payment identifier
    const hasValidId = paymentId || (type && id);
    if (!hasValidId) {
      setError('Invalid payment identifier');
      setLoading(false);
      return;
    }

    // Check authentication
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    // All conditions met, fetch payment
    console.log('Fetching payment...');
    fetchPayment();
  }, [paymentId, type, id, authLoading, isAuthenticated, token, user]);

  const handleViewReceipt = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        toast.error('Authentication required. Please log in.');
        return;
      }

      if (!payment || !payment._id) {
        toast.error('Payment information not available.');
        return;
      }

      // Fetch the HTML content with authentication headers
      const response = await axios.get(
        `${API_BASE_URL}/payments/${payment._id}/receipt?fallback=html`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Open HTML in new window for viewing/printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to view receipt in new window.');
        return;
      }
      
      printWindow.document.write(response.data);
      printWindow.document.close();
      printWindow.focus();
      
      toast.success('Receipt opened in new window.');
    } catch (error) {
      console.error('Error opening receipt:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. You can only view your own receipts.');
      } else if (error.response?.status === 404) {
        toast.error('Receipt not found.');
      } else {
        toast.error('Failed to open receipt.');
      }
    }
  };

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      // Ensure we have a token for authorization
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        toast.error('Authentication required. Please log in.');
        setDownloading(false);
        return;
      }

      if (!payment || !payment._id) {
        toast.error('Payment information not available.');
        setDownloading(false);
        return;
      }

      // First try PDF download
      try {
        const response = await axios.get(
          `${API_BASE_URL}/payments/${payment._id}/receipt`,
          { 
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt-${payment._id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Receipt downloaded successfully');
        return; // Success, exit here
      } catch (pdfError) {
        console.log('PDF download failed, trying HTML fallback...', pdfError);
        
        // If PDF fails, try HTML fallback
        if (pdfError.response?.status === 500) {
          const fallbackResponse = await axios.get(
            `${API_BASE_URL}/payments/${payment._id}/receipt?fallback=html`,
            { 
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          
          // Open HTML in new window for printing
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            toast.error('Please allow popups to view receipt for printing.');
            return;
          }
          
          printWindow.document.write(fallbackResponse.data);
          printWindow.document.close();
          printWindow.focus();
          
          toast.info('PDF generation unavailable. Receipt opened in new window - use browser print to save as PDF.');
          return; // Success with fallback
        }
        
        // Re-throw the error if it's not a 500 error
        throw pdfError;
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      
      if (error.response?.status === 403) {
        toast.error('Access denied. You can only view your own payment receipts.');
      } else if (error.response?.status === 404) {
        toast.error('Payment not found.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to download receipt';
        toast.error(errorMessage);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress size={60} color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading receipt...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !payment) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Payment not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
        >
          Back
        </Button>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrintReceipt}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            onClick={handleViewReceipt}
          >
            View Receipt
          </Button>
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={20} /> : <Download />}
            onClick={handleDownloadReceipt}
            disabled={downloading}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Receipt Card */}
      <Card sx={{ p: 4, mb: 4, '@media print': { boxShadow: 'none', border: '1px solid #ddd' } }}>
        <CardContent>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <ReceiptIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" component="h1" gutterBottom>
              Payment Receipt
            </Typography>
            <Chip
              icon={<CheckCircle />}
              label={`Payment ${payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}`}
              color="success"
              size="large"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Company Info */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" component="h2" gutterBottom>
              Students Enrollment System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Online Learning Platform
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: support@studentsenrollment.com
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Payment Details */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Payment Information
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Receipt Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    #{payment._id.slice(-8).toUpperCase()}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {payment.transactionId || payment.metadata?.sslTransactionId || 'N/A'}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Date
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatDate(payment.paymentDate || payment.updatedAt)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {payment.paymentMethod === 'sslcommerz' ? 'SSLCommerz' : 
                     payment.paymentMethod === 'stripe' ? 'Credit/Debit Card' : 
                     payment.paymentMethod?.toUpperCase()}
                  </Typography>
                </Box>

                {payment.metadata?.cardType && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Card Type
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {payment.metadata.cardType}
                    </Typography>
                  </Box>
                )}

                {payment.metadata?.bankTransactionId && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Bank Transaction ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {payment.metadata.bankTransactionId}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Customer Information
                </Typography>
                
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2 }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Student Name
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {payment.user?.firstName} {payment.user?.lastName}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2 }}>
                    <Email />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {payment.user?.email}
                    </Typography>
                  </Box>
                </Box>

                {payment.user?.phone && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      <Phone />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {payment.user.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Course Details */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Course Information
            </Typography>
            
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar
                src={payment.course?.thumbnail}
                sx={{ width: 80, height: 80, mr: 3 }}
              >
                <School />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {payment.course?.title || payment.metadata?.courseTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {payment.course?.description || payment.description}
                </Typography>
                {payment.course && (
                  <Box display="flex" gap={1}>
                    {payment.course.category && (
                      <Chip label={payment.course.category} size="small" />
                    )}
                    {payment.course.level && (
                      <Chip label={payment.course.level} size="small" variant="outlined" />
                    )}
                    {payment.course.duration && (
                      <Chip label={`${payment.course.duration} hours`} size="small" variant="outlined" />
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Payment Summary */}
          <Paper sx={{ p: 3, backgroundColor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom color="primary">
              Payment Summary
            </Typography>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">Course Price:</Typography>
              <Typography variant="body1">
                {payment.metadata?.originalAmount && payment.metadata?.originalCurrency
                  ? formatPrice(payment.metadata.originalAmount, payment.metadata.originalCurrency)
                  : formatPrice(payment.amount, payment.currency)
                }
              </Typography>
            </Box>

            {payment.metadata?.originalAmount && payment.metadata?.originalCurrency && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Amount in BDT:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPrice(payment.amount, payment.currency)}
                </Typography>
              </Box>
            )}

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">Processing Fee:</Typography>
              <Typography variant="body1">
                {formatPrice(0, payment.currency)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">Tax:</Typography>
              <Typography variant="body1">
                {formatPrice(payment.tax?.amount || 0, payment.currency)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" color="primary">
                Total Paid:
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {payment.metadata?.originalAmount && payment.metadata?.originalCurrency
                  ? formatPrice(payment.metadata.originalAmount, payment.metadata.originalCurrency)
                  : formatPrice(payment.amount, payment.currency)
                }
              </Typography>
            </Box>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Footer */}
          <Box textAlign="center" mt={4}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Thank you for choosing Students Enrollment System!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              For any questions about this payment, please contact our support team at support@studentsenrollment.com
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This is an electronically generated receipt.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentReceipt;
