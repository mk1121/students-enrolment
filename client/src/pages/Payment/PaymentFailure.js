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
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  Support,
  School,
  ArrowBack,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { formatPrice } from '../../utils/currency';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollment');
  const errorMessage = searchParams.get('error');
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEnrollmentDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/enrollments/${enrollmentId}`);
      setEnrollment(response.data.enrollment);
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      // Don't show error toast here as the main issue is payment failure
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollmentDetails();
    } else {
      setLoading(false);
    }
  }, [enrollmentId, fetchEnrollmentDetails]);

  const handleRetryPayment = () => {
    if (enrollment) {
      navigate(`/checkout/${enrollmentId}`);
    }
  };

  const handleContactSupport = () => {
    // Navigate to support page or open email client
    window.location.href = 'mailto:support@example.com?subject=Payment Issue&body=I encountered an issue with my payment for enrollment ID: ' + enrollmentId;
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <ErrorOutline sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="error.main">
            Payment Failed
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We're sorry, but your payment could not be processed at this time.
          </Typography>
          
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Error:</strong> {errorMessage}
              </Typography>
            </Alert>
          )}
          
          {enrollment && (
            <Box sx={{ mt: 4, textAlign: 'left' }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Your enrollment for <strong>{enrollment.course.title}</strong> is still pending payment.
                </Typography>
              </Alert>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Course Details
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={enrollment.course.thumbnail}
                      sx={{ width: 60, height: 60 }}
                    >
                      <School />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6">{enrollment.course.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {enrollment.course.description}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemText
                        primary="Enrollment ID"
                        secondary={enrollment._id}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText
                        primary="Payment Amount"
                        secondary={formatPrice(enrollment.payment.amount, enrollment.payment.currency)}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText
                        primary="Payment Status"
                        secondary={
                          <Typography variant="body2" color="error">
                            {enrollment.payment.paymentStatus}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Common reasons for payment failure:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Insufficient funds in your account</li>
              <li>Incorrect card details</li>
              <li>Card expired or blocked</li>
              <li>Network connectivity issues</li>
              <li>Bank declined the transaction</li>
            </ul>
          </Alert>
          
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            {enrollment && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Refresh />}
                onClick={handleRetryPayment}
              >
                Retry Payment
              </Button>
            )}
            <Button
              variant="outlined"
              size="large"
              startIcon={<Support />}
              onClick={handleContactSupport}
            >
              Contact Support
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/courses')}
            >
              Browse Courses
            </Button>
            <Button
              variant="text"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </Box>
          
          <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              If you continue to experience issues, please contact our support team at{' '}
              <a href="mailto:support@example.com">support@example.com</a> or call{' '}
              <a href="tel:+1234567890">+1 (234) 567-890</a>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentFailure;
