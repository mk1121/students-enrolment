import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Receipt,
  School,
  ArrowForward,
  PlayArrow,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import { formatPrice } from '../../../utils/currency';
import { toast } from 'react-toastify';

const SSLCommerzSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const tranId = searchParams.get('tran_id');
        const valId = searchParams.get('val_id');
        const status = searchParams.get('status');

        console.log('URL Search Params Debug:');
        console.log('Full URL:', window.location.href);
        console.log('Search params string:', window.location.search);
        console.log('All search params:', Object.fromEntries(searchParams.entries()));
        console.log('tran_id:', tranId);
        console.log('val_id:', valId);
        console.log('status:', status);
        console.log('status type:', typeof status);
        console.log('status length:', status ? status.length : 'N/A');

        if (!tranId || !valId) {
          console.error('Missing required parameters:', { tranId, valId });
          setError('Missing payment verification parameters');
          return;
        }

        // Verify payment with backend
        console.log('Sending to backend:', { tran_id: tranId, val_id: valId, status: status });
        const response = await axios.post(`${API_BASE_URL}/payments/sslcommerz/verify`, {
          tran_id: tranId,
          val_id: valId,
          status: status,
        });

        if (response.data.payment) {
          console.log('Payment data received:', response.data.payment);
          console.log('Enrollment data received:', response.data.enrollment);
          console.log('Course data from payment:', response.data.payment.course);
          console.log('Course data from enrollment:', response.data.enrollment?.course);
          
          setPaymentData(response.data.payment);
          setEnrollmentData(response.data.enrollment);
          toast.success('Payment verified successfully!');
        } else {
          setError('Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error.response?.data?.message || 'Payment verification failed');
        toast.error('Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleStartCourse = () => {
    if (enrollmentData && enrollmentData.course) {
      navigate(`/courses/${enrollmentData.course._id}/learn`);
    } else if (paymentData && paymentData.course) {
      navigate(`/courses/${paymentData.course._id}/learn`);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoToEnrollments = () => {
    navigate('/enrollments');
  };

  const handleViewReceipt = () => {
    if (paymentData) {
      // Navigate to payment receipt page
      navigate(`/payment/receipt/${paymentData._id}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress size={60} color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying your payment...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we confirm your payment with SSLCommerz
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6">Payment Verification Failed</Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
            
            <Typography variant="body1" paragraph>
              There was an issue verifying your payment. Please contact support if you believe this is an error.
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/support')}
                sx={{ mr: 2 }}
              >
                Contact Support
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          {/* Success Icon */}
          <CheckCircle 
            sx={{ 
              fontSize: 80, 
              color: 'success.main', 
              mb: 2 
            }} 
          />
          
          {/* Success Message */}
          <Typography variant="h4" gutterBottom color="success.main">
            Payment Successful!
          </Typography>
          
          <Typography variant="h6" paragraph>
            Your enrollment has been confirmed
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Thank you for your payment. Your course enrollment is now active and you can start learning immediately.
          </Typography>

          <Divider sx={{ my: 4 }} />

          {/* Course and Enrollment Details */}
          {(enrollmentData || paymentData) && (
            <Box sx={{ textAlign: 'left', mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Enrollment Details
              </Typography>
              
              {/* Course Information */}
              {((enrollmentData && enrollmentData.course) || (paymentData && paymentData.course)) && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    {(() => {
                      const course = (enrollmentData && enrollmentData.course) || (paymentData && paymentData.course);
                      return (
                        <>
                          <Avatar
                            src={course.thumbnail}
                            sx={{ width: 80, height: 80 }}
                          >
                            <School />
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h6" gutterBottom>
                              {course.title || paymentData?.metadata?.courseTitle || 'Course'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {course.description || paymentData?.description || 'Course description not available'}
                            </Typography>
                            <Box display="flex" gap={1}>
                              {course.category && (
                                <Chip label={course.category} size="small" />
                              )}
                              {course.level && (
                                <Chip label={course.level} size="small" variant="outlined" />
                              )}
                              {course.duration && (
                                <Chip label={`${course.duration} hours`} size="small" variant="outlined" />
                              )}
                            </Box>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                </Paper>
              )}

              {/* Payment Information */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Status
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    ✅ {paymentData?.status?.charAt(0).toUpperCase() + paymentData?.status?.slice(1) || 'Completed'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {paymentData?.transactionId || paymentData?.metadata?.sslTransactionId || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Course
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {enrollmentData?.course?.title || paymentData?.metadata?.courseTitle || paymentData?.course?.title || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {paymentData?.metadata?.originalAmount && paymentData?.metadata?.originalCurrency 
                      ? `${formatPrice(paymentData.metadata.originalAmount, paymentData.metadata.originalCurrency)} (${formatPrice(paymentData.amount, paymentData.currency)})`
                      : formatPrice(paymentData?.amount, paymentData?.currency)
                    }
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    SSLCommerz
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Enrollment Date
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {enrollmentData?.enrollmentDate
                      ? new Date(enrollmentData.enrollmentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : (paymentData?.paymentDate || paymentData?.updatedAt)
                        ? new Date(paymentData.paymentDate || paymentData.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'
                    }
                  </Typography>
                </Box>

                {/* Bank Transaction ID if available */}
                {paymentData?.metadata?.bankTransactionId && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Bank Transaction ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {paymentData.metadata.bankTransactionId}
                    </Typography>
                  </Box>
                )}

                {/* Card Type if available */}
                {paymentData?.metadata?.cardType && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Method Details
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {paymentData.metadata.cardType}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleStartCourse}
              sx={{ mr: 2 }}
            >
              Start Course
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<Receipt />}
              onClick={handleViewReceipt}
              sx={{ mr: 2 }}
            >
              View Receipt
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<School />}
              onClick={handleGoToEnrollments}
              sx={{ mr: 2 }}
            >
              My Enrollments
            </Button>

            <Button
              variant="text"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleGoToDashboard}
            >
              Go to Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SSLCommerzSuccess;
