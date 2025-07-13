import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from '@mui/material';
import {
  CreditCard,
  LocalAtm,
  Security,
  CheckCircle,
  School,
  Person,
  Email,
  Phone,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '../../config/stripe';
import StripeCheckoutForm from '../../components/Payment/StripeCheckoutForm';
import { API_BASE_URL } from '../../config/api';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

const Checkout = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [activeStep, setActiveStep] = useState(0);
  const [clientSecret, setClientSecret] = useState(null);
  const [stripePromise] = useState(() => getStripe());
  // eslint-disable-next-line no-unused-vars
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  const steps = ['Review Order', 'Payment Details', 'Confirmation'];

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: <CreditCard />,
      description: 'Secure payment with Stripe',
    },
    {
      id: 'sslcommerz',
      name: 'SSLCommerz',
      icon: <LocalAtm />,
      description: 'Local payment gateway',
    },
  ];

  const fetchEnrollmentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/enrollments/${enrollmentId}`);
      setEnrollment(response.data.enrollment);
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      toast.error('Failed to load enrollment details');
      navigate('/enrollments');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId, navigate]);

  useEffect(() => {
    fetchEnrollmentDetails();
  }, [fetchEnrollmentDetails]);

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      if (paymentMethod === 'stripe') {
        handleCreatePaymentIntent();
      } else {
        handlePayment();
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleCreatePaymentIntent = async () => {
    setProcessing(true);
    try {
      const paymentPayload = {
        enrollmentId,
        paymentMethod: 'stripe',
      };

      console.log('Creating payment intent with payload:', paymentPayload);
      const response = await axios.post(`${API_BASE_URL}/payments/create-payment-intent`, paymentPayload);
      console.log('Payment intent response:', response.data);
      
      if (response.data.clientSecret) {
        setClientSecret(response.data.clientSecret);
        // Payment form is ready - no toast needed as UI will update
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment intent creation error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePaymentSuccess = async (paymentIntent) => {
    console.log('Stripe payment successful:', paymentIntent);
    
    try {
      // Confirm payment success with backend
      await axios.post(`${API_BASE_URL}/payments/confirm-success`, {
        enrollmentId,
        paymentIntentId: paymentIntent.id,
      });
      
      console.log('Payment confirmation sent to backend');
    } catch (error) {
      console.error('Error confirming payment with backend:', error);
      // Continue to success page even if confirmation fails (webhook should handle it)
    }
    
    // Navigate to success page
    navigate(`/payment/success?enrollment=${enrollmentId}&payment_intent=${paymentIntent.id}`);
  };

  const handleStripePaymentError = (error) => {
    console.error('Stripe payment error:', error);
    toast.error(error.message || 'Payment failed');
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      let response;
      
      if (paymentMethod === 'sslcommerz') {
        // Use dedicated SSLCommerz endpoint
        const sslcommerzPayload = {
          enrollmentId,
        };
        console.log('Creating SSLCommerz payment with payload:', sslcommerzPayload);
        response = await axios.post(`${API_BASE_URL}/payments/sslcommerz/init`, sslcommerzPayload);
      } else {
        // Use generic endpoint for other payment methods
        const paymentPayload = {
          enrollmentId,
          paymentMethod,
          ...(paymentMethod !== 'stripe' && { paymentData }),
        };
        console.log('Creating payment with payload:', paymentPayload);
        response = await axios.post(`${API_BASE_URL}/payments/create-payment-intent`, paymentPayload);
      }
      
      console.log('Payment response:', response.data);
      
      // Handle different payment methods (non-Stripe)
      if (paymentMethod === 'sslcommerz' && response.data.gatewayUrl) {
        // Redirect to SSLCommerz
        window.location.href = response.data.gatewayUrl;
      } else {
        toast.error('Payment method not supported or invalid response');
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            {enrollment && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={enrollment.course.thumbnail}
                    sx={{ width: 80, height: 80 }}
                  >
                    <School />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6">{enrollment.course.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {enrollment.course.description}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip label={enrollment.course.category} size="small" />
                      <Chip label={enrollment.course.level} size="small" variant="outlined" />
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">Course Price:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(enrollment.payment.amount, enrollment.payment.currency)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                  <Typography variant="body1">Processing Fee:</Typography>
                  <Typography variant="body1">
                    {formatPrice(0, enrollment.payment.currency)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(enrollment.payment.amount, enrollment.payment.currency)}
                  </Typography>
                </Box>
              </Paper>
            )}
            
            <Typography variant="h6" gutterBottom>
              Student Information
            </Typography>
            <Paper sx={{ p: 3 }}>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Name"
                    secondary={`${user?.firstName} ${user?.lastName}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Email />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email"
                    secondary={user?.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Phone />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone"
                    secondary={user?.phone || 'Not provided'}
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <RadioGroup value={paymentMethod} onChange={handlePaymentMethodChange}>
                {paymentMethods.map((method) => (
                  <Paper key={method.id} sx={{ p: 2, mb: 2 }}>
                    <FormControlLabel
                      value={method.id}
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={2}>
                          {method.icon}
                          <Box>
                            <Typography variant="body1">{method.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {method.description}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>

            {paymentMethod === 'stripe' && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Credit/Debit Card Payment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your card details will be securely processed in the next step using Stripe's secure payment system.
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    🔒 Your payment information is encrypted and secure. No card details are stored on our servers.
                  </Typography>
                </Alert>
              </Paper>
            )}
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center">
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {paymentMethod === 'stripe' && !clientSecret 
                ? 'Review Your Order' 
                : paymentMethod === 'stripe' && clientSecret 
                  ? 'Enter Payment Details' 
                  : 'Complete Payment'
              }
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {paymentMethod === 'stripe' && !clientSecret 
                ? 'Please review your order details before initializing the payment.'
                : paymentMethod === 'stripe' && clientSecret
                  ? 'Enter your card details below to complete the payment securely.'
                  : 'Enter your payment details to complete the purchase.'
              }
            </Typography>
            
            {enrollment && (
              <Paper sx={{ p: 3, mb: 3, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Order Details
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Course:</Typography>
                  <Typography>{enrollment.course.title}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Payment Method:</Typography>
                  <Typography>
                    {paymentMethods.find(m => m.id === paymentMethod)?.name}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(enrollment.payment.amount, enrollment.payment.currency)}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Stripe Elements Integration */}
            {paymentMethod === 'stripe' && clientSecret && stripePromise && enrollment && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckoutForm
                  clientSecret={clientSecret}
                  amount={Math.round(enrollment.payment.amount * 100)}
                  currency={enrollment.payment.currency}
                  onSuccess={handleStripePaymentSuccess}
                  onError={handleStripePaymentError}
                  processing={processing}
                  onProcessingChange={setProcessing}
                />
              </Elements>
            )}
            
            {paymentMethod !== 'stripe' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Security />
                  <Typography variant="body2">
                    Your payment is secured with 256-bit SSL encryption
                  </Typography>
                </Box>
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
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

  if (!enrollment) {
    return (
      <Container>
        <Alert severity="error">
          Enrollment not found. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {renderStepContent(activeStep)}
              
              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  Back
                </Button>
                
                {/* Only show Next/Complete Payment button if not on Stripe payment confirmation */}
                {!(paymentMethod === 'stripe' && activeStep === steps.length - 1 && clientSecret) && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={processing}
                    startIcon={processing && <CircularProgress size={20} />}
                  >
                    {activeStep === steps.length - 1 
                      ? (paymentMethod === 'stripe' ? 'Initialize Payment' : 'Complete Payment')
                      : 'Next'
                    }
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              {enrollment && (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={enrollment.course.thumbnail}
                      sx={{ width: 50, height: 50 }}
                    >
                      <School />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body1" noWrap>
                        {enrollment.course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {enrollment.course.level}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Subtotal:</Typography>
                    <Typography>
                      {formatPrice(enrollment.payment.amount, enrollment.payment.currency)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Tax:</Typography>
                    <Typography>{formatPrice(0, enrollment.payment.currency)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      {formatPrice(enrollment.payment.amount, enrollment.payment.currency)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;
