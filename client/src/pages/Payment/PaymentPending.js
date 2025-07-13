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
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  HourglassEmpty,
  School,
  Home,
  Support,
  Receipt,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { formatPrice } from '../../utils/currency';

const PaymentPending = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollment');
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEnrollmentDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/enrollments/${enrollmentId}`);
      setEnrollment(response.data.enrollment);
    } catch (error) {
      setEnrollment(null);
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

  const handleContactSupport = () => {
    window.location.href = `mailto:support@example.com?subject=Payment Pending&body=I have a pending payment for enrollment ID: ${enrollmentId}`;
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
          <HourglassEmpty sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="warning.main">
            Payment Pending
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your payment is currently pending. Please follow the instructions provided by your payment method, or contact support if you need assistance.
          </Typography>

          {enrollment && (
            <Box sx={{ mt: 4, textAlign: 'left' }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Your enrollment for <strong>{enrollment.course.title}</strong> is awaiting payment confirmation.
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

                  <Divider sx={{ my: 2 }} />

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
                        primary="Payment Method"
                        secondary={enrollment.payment.paymentMethod}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText
                        primary="Payment Status"
                        secondary={enrollment.payment.paymentStatus}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

          {!enrollment && (
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
                  onClick={() => navigate('/')}
                >
                  Go Home
                </Button>
              </Box>
            </Box>
          )}

          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Receipt />}
              onClick={() => navigate('/enrollments')}
            >
              View Enrollments
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Support />}
              onClick={handleContactSupport}
            >
              Contact Support
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
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentPending;