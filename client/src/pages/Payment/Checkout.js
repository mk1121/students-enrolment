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
  TextField,
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
  Payment,
  LocalAtm,
  AccountBalance,
  Security,
  CheckCircle,
  School,
  Person,
  Email,
  Phone,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
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
      id: 'paypal',
      name: 'PayPal',
      icon: <Payment />,
      description: 'Pay with your PayPal account',
    },
    {
      id: 'sslcommerz',
      name: 'SSLCommerz',
      icon: <LocalAtm />,
      description: 'Local payment gateway',
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: <AccountBalance />,
      description: 'Direct bank transfer',
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

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPaymentData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setPaymentData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handlePayment();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const paymentPayload = {
        enrollmentId,
        paymentMethod,
        ...(paymentMethod === 'stripe' && { paymentData }),
      };

      console.log('Creating payment intent with payload:', paymentPayload);
      const response = await axios.post(`${API_BASE_URL}/payments/create-payment-intent`, paymentPayload);
      console.log('Payment intent response:', response.data);
      
      // Handle different payment methods
      if (paymentMethod === 'stripe' && response.data.clientSecret) {
        // Handle Stripe payment confirmation
        toast.success('Payment processing...');
        navigate(`/payment/success?enrollment=${enrollmentId}`);
      } else if (paymentMethod === 'paypal' && response.data.approvalUrl) {
        // Redirect to PayPal
        window.location.href = response.data.approvalUrl;
      } else if (paymentMethod === 'sslcommerz' && response.data.gatewayUrl) {
        // Redirect to SSLCommerz
        window.location.href = response.data.gatewayUrl;
      } else if (paymentMethod === 'bank_transfer') {
        // Show bank transfer instructions
        toast.info('Bank transfer instructions sent to your email');
        navigate(`/payment/pending?enrollment=${enrollmentId}`);
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
                  Card Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cardholder Name"
                      value={paymentData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Number"
                      value={paymentData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      value={paymentData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      placeholder="MM/YY"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="CVV"
                      value={paymentData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      placeholder="123"
                    />
                  </Grid>
                </Grid>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Billing Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      value={paymentData.billingAddress.street}
                      onChange={(e) => handleInputChange('billingAddress.street', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={paymentData.billingAddress.city}
                      onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="State"
                      value={paymentData.billingAddress.state}
                      onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="ZIP Code"
                      value={paymentData.billingAddress.zipCode}
                      onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={paymentData.billingAddress.country}
                      onChange={(e) => handleInputChange('billingAddress.country', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {paymentMethod === 'bank_transfer' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Bank transfer instructions will be sent to your email after confirmation.
                  Please allow 2-3 business days for manual verification.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center">
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Review Your Order
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Please review your order details before completing the payment.
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
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Security />
                <Typography variant="body2">
                  Your payment is secured with 256-bit SSL encryption
                </Typography>
              </Box>
            </Alert>
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
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={processing}
                  startIcon={processing && <CircularProgress size={20} />}
                >
                  {activeStep === steps.length - 1 ? 'Complete Payment' : 'Next'}
                </Button>
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
