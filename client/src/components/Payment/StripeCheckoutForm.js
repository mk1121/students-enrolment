import React, { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { toast } from 'react-toastify';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146',
    },
  },
};

const StripeCheckoutForm = ({ 
  clientSecret, 
  amount, 
  currency = 'BDT',
  onSuccess, 
  onError,
  processing = false,
  onProcessingChange 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(processing);

  // Format currency display
  const formatCurrency = (amount, currency) => {
    const value = (amount / 100).toFixed(2);
    switch (currency.toUpperCase()) {
      case 'BDT':
        return `৳${value}`;
      case 'USD':
        return `$${value}`;
      case 'EUR':
        return `€${value}`;
      case 'GBP':
        return `£${value}`;
      default:
        return `${currency.toUpperCase()} ${value}`;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setError('Card element not found.');
      return;
    }

    setIsProcessing(true);
    if (onProcessingChange) {
      onProcessingChange(true);
    }
    setError(null);

    try {
      // Confirm the payment with the card element
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: card,
          },
        }
      );

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        setError(confirmError.message);
        toast.error(confirmError.message);
        if (onError) {
          onError(confirmError);
        }
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      } else {
        console.log('Payment status:', paymentIntent.status);
        setError(`Payment ${paymentIntent.status}. Please try again.`);
        if (onError) {
          onError({ message: `Payment ${paymentIntent.status}` });
        }
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      const errorMessage = err.message || 'An unexpected error occurred during payment processing.';
      setError(errorMessage);
      toast.error(errorMessage);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
      if (onProcessingChange) {
        onProcessingChange(false);
      }
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Lock color="primary" />
        Secure Payment
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Your payment information is encrypted and secure
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ my: 3 }}>
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
            Card Information
          </Typography>
          <Box
            sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              backgroundColor: '#fafafa',
              '&:focus-within': {
                borderColor: 'primary.main',
                backgroundColor: 'white',
              },
            }}
          >
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
          <Typography variant="h6">
            Total: {formatCurrency(amount, currency)}
          </Typography>
          
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!stripe || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <Lock />}
            sx={{ minWidth: 150 }}
          >
            {isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount, currency)}`}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default StripeCheckoutForm;
