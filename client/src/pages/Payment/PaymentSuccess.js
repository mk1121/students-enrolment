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
  CheckCircle,
  School,
  Download,
  PlayArrow,
  Home,
  Receipt,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { formatPrice } from '../../utils/currency';

const PaymentSuccess = () => {
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
      console.error('Error fetching enrollment:', error);
      toast.error('Failed to load enrollment details');
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

  const handleStartCourse = () => {
    if (enrollment) {
      navigate(`/courses/${enrollment.course._id}/learn`);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!enrollment || !enrollment.payment || !enrollment.payment._id) {
      toast.error('Payment information is missing.');
      return;
    }
    const paymentId = enrollment.payment._id;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payments/${paymentId}/receipt`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
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
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="success.main">
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Thank you for your payment. Your enrollment has been confirmed.
          </Typography>
          
          {enrollment && (
            <Box sx={{ mt: 4, textAlign: 'left' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  You are now enrolled in <strong>{enrollment.course.title}</strong>
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
                        primary="Enrollment Date"
                        secondary={new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
              
              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleStartCourse}
                >
                  Start Course
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Download />}
                  onClick={handleDownloadReceipt}
                >
                  Download Receipt
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Receipt />}
                  onClick={() => navigate('/enrollments')}
                >
                  View Enrollments
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
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentSuccess;
