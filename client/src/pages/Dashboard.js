import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  School,
  Assignment,
  Payment,
  TrendingUp,
  BookmarkBorder,
  PlayArrow,
  CheckCircle,
  Person,
  Email,
  Phone,
  Edit,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import config from '../config/api';
import { formatPrice } from '../utils/currency';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    enrollments: [],
    recentCourses: [],
    stats: {
      totalEnrollments: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      totalSpent: 0,
    }
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user enrollments
      const enrollmentResponse = await fetch(`${config.API_BASE_URL}/enrollments/my-enrollments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!enrollmentResponse.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const enrollmentData = await enrollmentResponse.json();
      const enrollments = enrollmentData.enrollments || [];

      // Fetch recent courses
      const coursesResponse = await fetch(`${config.API_BASE_URL}/courses?limit=6&sortBy=createdAt&sortOrder=desc`);
      const coursesData = await coursesResponse.json();
      const recentCourses = coursesData.courses || [];

      // Calculate stats
      const stats = {
        totalEnrollments: enrollments.length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length,
        inProgressCourses: enrollments.filter(e => e.status === 'active').length,
        totalSpent: enrollments.reduce((total, e) => {
          if (e.payment && e.payment.status === 'completed') {
            return total + (e.payment.amount || 0);
          }
          return total;
        }, 0),
      };

      setDashboardData({
        enrollments,
        recentCourses,
        stats,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getProgressValue = (enrollment) => {
    if (enrollment.status === 'completed') return 100;
    if (enrollment.status === 'active') return Math.random() * 60 + 20; // Mock progress
    return 0;
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
          Error loading dashboard: {error}
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
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Track your learning progress and discover new courses
        </Typography>
      </Box>

      {/* User Profile Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              {user?.phone && (
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {user?.phone}
                  </Typography>
                </Box>
              )}
              <Chip 
                label={user?.role || 'Student'} 
                color="primary" 
                size="small"
                icon={<Person />}
              />
            </Grid>
            <Grid item>
              <Tooltip title="Edit Profile">
                <IconButton 
                  color="primary"
                  onClick={() => navigate('/profile')}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Enrollments
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.stats.totalEnrollments}
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
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.stats.completedCourses}
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
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    In Progress
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.stats.inProgressCourses}
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
                  <Payment />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Spent
                  </Typography>
                  <Typography variant="h5">
                    {formatPrice(dashboardData.stats.totalSpent)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* My Enrollments */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                  My Courses
                </Typography>
                <Button
                  component={Link}
                  to="/courses"
                  variant="outlined"
                  startIcon={<BookmarkBorder />}
                >
                  Browse All Courses
                </Button>
              </Box>

              {dashboardData.enrollments.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No courses enrolled yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Start your learning journey by enrolling in courses
                  </Typography>
                  <Button
                    component={Link}
                    to="/courses"
                    variant="contained"
                    startIcon={<School />}
                  >
                    Explore Courses
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Course</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Enrolled</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.enrollments.map((enrollment) => (
                        <TableRow key={enrollment._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                {enrollment.course?.title || 'Course Title'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {enrollment.course?.category || 'Category'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={enrollment.status}
                              color={getStatusColor(enrollment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box width="100px">
                              <LinearProgress
                                variant="determinate"
                                value={getProgressValue(enrollment)}
                                sx={{ mb: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {Math.round(getProgressValue(enrollment))}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Course">
                              <IconButton
                                component={Link}
                                to={`/courses/${enrollment.course?._id}`}
                                size="small"
                                color="primary"
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
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

        {/* Recent Courses & Quick Actions */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  component={Link}
                  to="/courses"
                  variant="contained"
                  fullWidth
                  startIcon={<School />}
                >
                  Browse Courses
                </Button>
                <Button
                  component={Link}
                  to="/profile"
                  variant="outlined"
                  fullWidth
                  startIcon={<Person />}
                >
                  Edit Profile
                </Button>
                {dashboardData.enrollments.length > 0 && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Assignment />}
                    onClick={() => {
                      const activeEnrollment = dashboardData.enrollments.find(e => e.status === 'active');
                      if (activeEnrollment) {
                        navigate(`/courses/${activeEnrollment.course._id}`);
                      }
                    }}
                  >
                    Continue Learning
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Recent Courses */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Courses
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {dashboardData.recentCourses.slice(0, 4).map((course) => (
                  <Card key={course._id} variant="outlined" sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/courses/${course._id}`)}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {course.title}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={course.category}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          {formatPrice(course.price)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                {dashboardData.recentCourses.length === 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No recent courses available
                  </Typography>
                )}
              </Box>
            </CardContent>
            <CardActions>
              <Button
                component={Link}
                to="/courses"
                size="small"
                fullWidth
              >
                View All Courses
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 