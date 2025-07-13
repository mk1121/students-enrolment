import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  School,
  PlayArrow,
  Receipt,
  ArrowForward,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { formatPrice } from '../../utils/currency';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollment');
  const paymentIntentId = searchParams.get('payment_intent');
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnrollmentDetails = useCallback(async () => {
    try {
      if (!enrollmentId) {
        throw new Error('Enrollment ID is missing');
      }
      
      const response = await axios.get(`${API_BASE_URL}/enrollments/${enrollmentId}`);
      setEnrollment(response.data.enrollment);
      
      // If we have a payment intent ID, we can optionally verify the payment was successful
      if (paymentIntentId) {
        console.log('Payment completed with Stripe Payment Intent:', paymentIntentId);
        toast.success('Payment verified successfully!');
      }
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      setError(error.response?.data?.message || 'Failed to load enrollment details');
      toast.error('Failed to load enrollment details');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId, paymentIntentId]);

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollmentDetails();
    } else {
      setLoading(false);
      setError('Enrollment ID is missing from the URL');
    }
  }, [enrollmentId, fetchEnrollmentDetails]);

  const handleStartCourse = () => {
    if (enrollment) {
      navigate(`/courses/${enrollment.course._id}/learn`);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoToEnrollments = () => {
    navigate('/enrollments');
  };

  const handleViewReceipt = () => {
    if (enrollment && enrollment.payment) {
      // For Stripe payments, we need to find the payment by payment intent ID
      if (paymentIntentId) {
        // Navigate to a receipt endpoint that can find the payment by payment intent ID
        navigate(`/payment/receipt/stripe/${paymentIntentId}`);
      } else if (enrollment.payment._id) {
        // For other payments that have a direct payment ID
        navigate(`/payment/receipt/${enrollment.payment._id}`);
      } else {
        // Fallback: try to find payment by enrollment ID
        navigate(`/payment/receipt/enrollment/${enrollment._id}`);
      }
    } else {
      toast.error('Payment information not available');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress size={60} color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading enrollment details...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we confirm your payment with Stripe
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

          {/* Payment Confirmation */}
          {paymentIntentId && (
            <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Stripe Payment Confirmed</strong>
                <br />
                Payment ID: {paymentIntentId}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ my: 4 }} />

          {/* Course and Enrollment Details */}
          {enrollment && (
            <Box sx={{ textAlign: 'left', mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Enrollment Details
              </Typography>
              
              {/* Course Information */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={enrollment.course.thumbnail}
                    sx={{ width: 80, height: 80 }}
                  >
                    <School />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {enrollment.course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {enrollment.course.description}
                    </Typography>
                    <Box display="flex" gap={1}>
                      {enrollment.course.category && (
                        <Chip label={enrollment.course.category} size="small" />
                      )}
                      {enrollment.course.level && (
                        <Chip label={enrollment.course.level} size="small" variant="outlined" />
                      )}
                      {enrollment.course.duration && (
                        <Chip label={`${enrollment.course.duration} hours`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>

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
                    ✅ {enrollment.payment?.paymentStatus?.charAt(0).toUpperCase() + enrollment.payment?.paymentStatus?.slice(1) || 'Completed'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {paymentIntentId || enrollment.payment?.transactionId || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Course
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {enrollment.course.title}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatPrice(enrollment.payment?.amount || enrollment.course.price, enrollment.payment?.currency || 'USD')}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Credit/Debit Card (Stripe)
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Enrollment Date
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>
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

          {/* Fallback if enrollment not loaded */}
          {!enrollment && !loading && !error && (
            <Box sx={{ mt: 4 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Unable to load enrollment details. Please check your enrollments page.
                </Typography>
              </Alert>
              
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={() => navigate('/enrollments')}
                >
                  View Enrollments
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentSuccess;
