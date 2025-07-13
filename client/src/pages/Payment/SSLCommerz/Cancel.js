import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';
import {
  Cancel,
  Refresh,
  Home,
  ShoppingCart,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const SSLCommerzCancel = () => {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const recordCancellation = async () => {
      try {
        const tranId = searchParams.get('tran_id');

        if (tranId) {
          // Record the cancellation on backend
          await axios.post(`${API_BASE_URL}/payments/sslcommerz/cancel`, {
            tran_id: tranId,
          });

          setPaymentInfo({
            transactionId: tranId,
          });
        }
      } catch (error) {
        console.error('Error recording payment cancellation:', error);
      }
    };

    recordCancellation();
  }, [searchParams]);

  const handleRetryPayment = () => {
    // Go back to checkout page
    navigate('/checkout');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBrowseCourses = () => {
    navigate('/courses');
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          {/* Cancel Icon */}
          <Cancel 
            sx={{ 
              fontSize: 80, 
              color: 'warning.main', 
              mb: 2 
            }} 
          />
          
          {/* Cancel Message */}
          <Typography variant="h4" gutterBottom color="warning.main">
            Payment Cancelled
          </Typography>
          
          <Typography variant="h6" paragraph>
            You have cancelled the payment process
          </Typography>

          <Alert severity="warning" sx={{ mb: 4 }}>
            <Typography variant="body1">
              Your payment was cancelled and no charges have been made to your account.
            </Typography>
          </Alert>

          <Typography variant="body1" color="text.secondary" paragraph>
            You can complete your enrollment by trying the payment again, or you can browse other courses and come back later.
          </Typography>

          <Divider sx={{ my: 4 }} />

          {/* Payment Info */}
          {paymentInfo && (
            <Box sx={{ textAlign: 'left', mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Transaction Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Transaction ID
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {paymentInfo.transactionId}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="warning.main">
                  Cancelled
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {new Date().toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}

          {/* What's Next */}
          <Box sx={{ textAlign: 'left', mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              What would you like to do next?
            </Typography>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Complete your payment to enroll in the course</li>
              <li>Browse other available courses</li>
              <li>Return to your dashboard to review pending enrollments</li>
              <li>Contact support if you need assistance</li>
            </ul>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Refresh />}
              onClick={handleRetryPayment}
              sx={{ mr: 2 }}
            >
              Complete Payment
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<ShoppingCart />}
              onClick={handleBrowseCourses}
              sx={{ mr: 2 }}
            >
              Browse Courses
            </Button>

            <Button
              variant="text"
              size="large"
              startIcon={<Home />}
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

export default SSLCommerzCancel;
