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
  Error,
  Refresh,
  Home,
  ContactSupport,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const SSLCommerzFail = () => {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const recordFailure = async () => {
      try {
        const tranId = searchParams.get('tran_id');
        const error = searchParams.get('error');

        if (tranId) {
          // Record the failure on backend
          await axios.post(`${API_BASE_URL}/payments/sslcommerz/fail`, {
            tran_id: tranId,
            error: error || 'Payment failed',
          });

          setPaymentInfo({
            transactionId: tranId,
            error: error || 'Payment failed',
          });
        }
      } catch (error) {
        console.error('Error recording payment failure:', error);
      }
    };

    recordFailure();
  }, [searchParams]);

  const handleRetryPayment = () => {
    // Go back to checkout page
    navigate('/checkout');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleContactSupport = () => {
    navigate('/support');
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          {/* Error Icon */}
          <Error 
            sx={{ 
              fontSize: 80, 
              color: 'error.main', 
              mb: 2 
            }} 
          />
          
          {/* Error Message */}
          <Typography variant="h4" gutterBottom color="error.main">
            Payment Failed
          </Typography>
          
          <Typography variant="h6" paragraph>
            Unfortunately, your payment could not be processed
          </Typography>

          <Alert severity="error" sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="body1">
              {paymentInfo?.error || 'Your payment was unsuccessful. Please try again or contact support.'}
            </Typography>
          </Alert>

          <Typography variant="body1" color="text.secondary" paragraph>
            No charges have been made to your account. You can try the payment again or choose a different payment method.
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
                <Typography variant="body1" fontWeight="bold" color="error.main">
                  Failed
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

          {/* Possible Reasons */}
          <Box sx={{ textAlign: 'left', mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Possible Reasons for Failure
            </Typography>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Insufficient funds in your account</li>
              <li>Incorrect card details or expired card</li>
              <li>Transaction limit exceeded</li>
              <li>Network connectivity issues</li>
              <li>Bank security restrictions</li>
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
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<ContactSupport />}
              onClick={handleContactSupport}
              sx={{ mr: 2 }}
            >
              Contact Support
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

export default SSLCommerzFail;
