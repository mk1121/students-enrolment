import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart,
  CheckCircle,
  Schedule,
  Star,
  Security,
  MoneyBack,
  Support,
  Certificate,
  Person,
  Email,
  Phone,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const EnrollmentForm = ({ course, onEnrollmentSuccess }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    paymentMethod: 'stripe',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      toast.info('Please login to enroll in this course');
      navigate('/login');
      return;
    }

    if (course.price === 0) {
      // Free course - enroll directly
      handleFreeEnrollment();
    } else {
      // Paid course - show enrollment form
      setShowForm(true);
    }
  };

  const handleFreeEnrollment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/enrollments`, {
        courseId: course._id,
        paymentMethod: 'free',
      });

      if (response.data.success) {
        toast.success('Successfully enrolled in the course!');
        onEnrollmentSuccess?.(response.data.enrollment);
        navigate(`/courses/${course._id}/learn`);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to enroll in course';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaidEnrollment = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/enrollments`, {
        courseId: course._id,
        paymentMethod: formData.paymentMethod,
        studentInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
      });

      if (response.data.success) {
        toast.success('Enrollment initiated! Redirecting to checkout...');
        navigate(`/checkout/${response.data.enrollment._id}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to enroll in course';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Enroll in {course.title}
            </Typography>
            
            <Box display="flex" gap={2} mb={3}>
              <Avatar
                src={course.thumbnail}
                variant="rounded"
                sx={{ width: 80, height: 60 }}
              />
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {course.instructor?.firstName} {course.instructor?.lastName}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Star color="warning" fontSize="small" />
                    <Typography variant="body2">
                      {course.rating?.average || 4.5} ({course.rating?.count || 0} reviews)
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      {course.duration} hours
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h5" color="primary">
                {formatPrice(course.price)}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Student Information
            </Typography>
            <Box component="form" noValidate>
              <Box display="flex" gap={2} mb={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <TextField
                fullWidth
                label="Phone (Optional)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>

            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              >
                <FormControlLabel
                  value="stripe"
                  control={<Radio />}
                  label="Credit/Debit Card (Stripe)"
                />
                <FormControlLabel
                  value="sslcommerz"
                  control={<Radio />}
                  label="Mobile Banking (bKash, Nagad, Rocket)"
                />
              </RadioGroup>
            </FormControl>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your payment information is secure and encrypted. We offer a 30-day money-back guarantee.
              </Typography>
            </Alert>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                size="large"
                onClick={handlePaidEnrollment}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Proceed to Checkout'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Enroll in This Course
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" color="primary">
            {course.price === 0 ? 'Free' : formatPrice(course.price)}
          </Typography>
          {course.originalPrice && course.originalPrice > course.price && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                {formatPrice(course.originalPrice)}
              </Typography>
              <Chip
                label={`${Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF`}
                color="secondary"
                size="small"
              />
            </Box>
          )}
        </Box>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText primary="Lifetime access to course materials" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Certificate color="success" />
            </ListItemIcon>
            <ListItemText primary="Certificate of completion" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Support color="success" />
            </ListItemIcon>
            <ListItemText primary="24/7 instructor support" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <MoneyBack color="success" />
            </ListItemIcon>
            <ListItemText primary="30-day money-back guarantee" />
          </ListItem>
        </List>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<ShoppingCart />}
          onClick={handleEnrollClick}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : course.price === 0 ? (
            'Enroll for Free'
          ) : (
            'Enroll Now'
          )}
        </Button>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Join {course.enrolledCount || 0} students already enrolled in this course!
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EnrollmentForm;
