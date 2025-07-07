import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera,
  Person,
  Email,
  Phone,
  CalendarToday,
  LocationOn,
  Shield,
  Verified,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/currency';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    profilePicture: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedCourses: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || '',
        },
        profilePicture: user.profilePicture || '',
      });
      
      // Fetch user statistics
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      // This would typically come from API calls
      // For now, we'll use placeholder data
      setStats({
        totalEnrollments: 5,
        activeEnrollments: 3,
        completedCourses: 2,
        totalSpent: 15000,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditToggle = () => {
    if (editing) {
      // Reset form data when canceling
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || '',
        },
        profilePicture: user.profilePicture || '',
      });
    }
    setEditing(!editing);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (result.success) {
        setPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'instructor':
        return 'warning';
      case 'student':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  src={user.profilePicture}
                  sx={{ width: 120, height: 120, fontSize: '2rem' }}
                >
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography variant="h4">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                      icon={<Shield />}
                    />
                    {user.isEmailVerified && (
                      <Chip
                        label="Verified"
                        color="success"
                        size="small"
                        icon={<Verified />}
                      />
                    )}
                  </Box>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    {user.email}
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button
                      variant={editing ? "outlined" : "contained"}
                      startIcon={editing ? <CancelIcon /> : <EditIcon />}
                      onClick={handleEditToggle}
                      disabled={loading}
                    >
                      {editing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                    {editing && (
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={20} /> : 'Save Changes'}
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => setPasswordDialog(true)}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Personal Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user.email}
                    disabled
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={user.role}
                    disabled
                    InputProps={{
                      startAdornment: <Shield sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Address Section */}
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Stats */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* Account Status */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Account Status" />
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Verified color={user.isEmailVerified ? 'success' : 'disabled'} />
                    <Typography>
                      Email {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <AccessTime color="primary" />
                    <Typography variant="body2">
                      Last Login: {formatDate(user.lastLogin)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CalendarToday color="primary" />
                    <Typography variant="body2">
                      Member Since: {formatDate(user.createdAt)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Learning Stats */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Learning Statistics" />
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Total Enrollments
                    </Typography>
                    <Typography variant="h6">{stats.totalEnrollments}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Active Courses
                    </Typography>
                    <Typography variant="h6">{stats.activeEnrollments}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Completed Courses
                    </Typography>
                    <Typography variant="h6">{stats.completedCourses}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Total Spent
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatPrice(stats.totalSpent)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordSave}
            variant="contained"
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            {loading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 