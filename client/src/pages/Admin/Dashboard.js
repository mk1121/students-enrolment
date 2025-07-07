import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  People,
  School,
  Payment,
  TrendingUp,
  Add,
  Edit,
  Visibility,
  AccountBalance,
  Assignment,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import config from '../../config/api';
import { formatPrice } from '../../utils/currency';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalCourses: 0,
      totalEnrollments: 0,
      totalRevenue: 0,
      activeStudents: 0,
      completedCourses: 0,
      pendingPayments: 0,
      monthlyRevenue: 0,
    },
    recentEnrollments: [],
    recentPayments: [],
    courses: [],
    users: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch multiple endpoints in parallel
      const [usersRes, coursesRes, enrollmentsRes, paymentsRes] = await Promise.all([
        fetch(`${config.API_BASE_URL}/users`, { headers }),
        fetch(`${config.API_BASE_URL}/courses`, { headers }),
        fetch(`${config.API_BASE_URL}/enrollments`, { headers }),
        fetch(`${config.API_BASE_URL}/payments`, { headers }).catch(() => ({ ok: false })), // Payments might not be accessible
      ]);

      const users = usersRes.ok ? (await usersRes.json()).users || [] : [];
      const courses = coursesRes.ok ? (await coursesRes.json()).courses || [] : [];
      const enrollments = enrollmentsRes.ok ? (await enrollmentsRes.json()).enrollments || [] : [];
      const payments = paymentsRes.ok ? (await paymentsRes.json()).payments || [] : [];

      // Calculate stats
      const stats = {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        activeStudents: users.filter(u => u.role === 'student' && u.isActive).length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        monthlyRevenue: payments
          .filter(p => {
            const paymentDate = new Date(p.createdAt);
            const now = new Date();
            return paymentDate.getMonth() === now.getMonth() && 
                   paymentDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0),
      };

      setDashboardData({
        stats,
        recentEnrollments: enrollments.slice(0, 5),
        recentPayments: payments.slice(0, 5),
        courses: courses.slice(0, 5),
        users: users.slice(0, 5),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': case 'active': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LinearProgress sx={{ width: '300px' }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading admin dashboard: {error}
        </Alert>
        <Button variant="contained" onClick={fetchDashboardData}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Admin Dashboard 📊
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Monitor and manage your students enrollment system
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.stats.totalUsers}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {dashboardData.stats.activeStudents} active students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Courses
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.stats.totalCourses}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Available for enrollment
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Enrollments
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.stats.totalEnrollments}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {dashboardData.stats.completedCourses} completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatPrice(dashboardData.stats.totalRevenue)}
                  </Typography>
                  <Typography variant="caption" color="info.main">
                    {formatPrice(dashboardData.stats.monthlyRevenue)} this month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component={Link}
                to="/admin/courses"
                variant="contained"
                fullWidth
                startIcon={<Add />}
              >
                Add New Course
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component={Link}
                to="/admin/users"
                variant="outlined"
                fullWidth
                startIcon={<People />}
              >
                Manage Users
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component={Link}
                to="/admin/enrollments"
                variant="outlined"
                fullWidth
                startIcon={<Assignment />}
              >
                View Enrollments
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                component={Link}
                to="/admin/payments"
                variant="outlined"
                fullWidth
                startIcon={<Payment />}
              >
                Payment Reports
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Recent Enrollments */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Recent Enrollments
                </Typography>
                <Button
                  component={Link}
                  to="/admin/enrollments"
                  size="small"
                  endIcon={<Visibility />}
                >
                  View All
                </Button>
              </Box>

              {dashboardData.recentEnrollments.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No recent enrollments
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recentEnrollments.map((enrollment) => (
                        <TableRow key={enrollment._id}>
                          <TableCell>
                            <Typography variant="body2">
                              {enrollment.user?.firstName} {enrollment.user?.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {enrollment.course?.title || 'Course'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={enrollment.status}
                              color={getStatusColor(enrollment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Course Management */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Course Management
                </Typography>
                <Button
                  component={Link}
                  to="/admin/courses"
                  size="small"
                  endIcon={<Visibility />}
                >
                  Manage All
                </Button>
              </Box>

              {dashboardData.courses.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No courses available
                  </Typography>
                  <Button
                    component={Link}
                    to="/admin/courses"
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    startIcon={<Add />}
                  >
                    Add First Course
                  </Button>
                </Box>
              ) : (
                <Box>
                  {dashboardData.courses.map((course) => (
                    <Card key={course._id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent sx={{ py: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box flex={1}>
                            <Typography variant="subtitle2" gutterBottom>
                              {course.title}
                            </Typography>
                            <Box display="flex" gap={1} mb={1}>
                              <Chip
                                label={course.category}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={course.level}
                                size="small"
                                color="primary"
                              />
                            </Box>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              {formatPrice(course.price)}
                            </Typography>
                          </Box>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Edit Course">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Course">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/courses/${course._id}`)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <CheckCircle color="success" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Active Students
                      </Typography>
                      <Typography variant="h6">
                        {dashboardData.stats.activeStudents}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Warning color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending Payments
                      </Typography>
                      <Typography variant="h6">
                        {dashboardData.stats.pendingPayments}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <TrendingUp color="info" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Completion Rate
                      </Typography>
                      <Typography variant="h6">
                        {dashboardData.stats.totalEnrollments > 0 
                          ? Math.round((dashboardData.stats.completedCourses / dashboardData.stats.totalEnrollments) * 100)
                          : 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 