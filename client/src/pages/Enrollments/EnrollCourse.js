import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Rating,
} from '@mui/material';
import {
  PlayCircle,
  Schedule,
  People,
  Star,
  CheckCircle,
  Language,
  Assignment,
  WorkspacePremium,
  ShoppingCart,
  School,
  AccessTime,
  CalendarToday,
  BookmarkBorder,
  Share,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const EnrollCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentDialog, setEnrollmentDialog] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [reviews, setReviews] = useState([]);

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
      setCourse(response.data.course);
      
      // Simulate fetching reviews (in real app, this would be a separate API call)
      setReviews([
        {
          id: 1,
          user: { name: 'John Doe', avatar: '' },
          rating: 5,
          comment: 'Excellent course! Very comprehensive and well-structured.',
          date: '2024-01-15',
        },
        {
          id: 2,
          user: { name: 'Jane Smith', avatar: '' },
          rating: 4,
          comment: 'Great content, learned a lot. Instructor was very helpful.',
          date: '2024-01-10',
        },
      ]);
    } catch (error) {
      toast.error('Failed to fetch course details');
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const checkEnrollmentStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/enrollments/my-enrollments`);
      const userEnrollments = response.data.enrollments;
      const courseEnrollment = userEnrollments.find(
        (enrollment) => enrollment.course._id === courseId
      );
      
      if (courseEnrollment) {
        setIsEnrolled(true);
        setEnrollment(courseEnrollment);
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      if (isAuthenticated) {
        checkEnrollmentStatus();
      }
    }
  }, [courseId, isAuthenticated, fetchCourseDetails, checkEnrollmentStatus]);

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      toast.info('Please login to enroll in courses');
      navigate('/login');
      return;
    }
    setEnrollmentDialog(true);
  };

  const handleEnrollConfirm = async () => {
    setEnrolling(true);
    try {
      const enrollmentData = {
        courseId: course._id,
        paymentMethod: 'stripe', // Default payment method
      };

      const response = await axios.post(`${API_BASE_URL}/enrollments`, enrollmentData);
      
      if (response.data.enrollment) {
        setIsEnrolled(true);
        setEnrollment(response.data.enrollment);
        setEnrollmentDialog(false);
        toast.success('Successfully enrolled in course!');
        
        // If course is free, redirect to course content
        if (course.price === 0) {
          navigate(`/courses/${courseId}/learn`);
        } else {
          // Redirect to checkout page
          navigate(`/checkout/${response.data.enrollment._id}`);
        }
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      if (error.response?.status === 400) {
        // Client error - show the specific message
        const message = error.response.data.message || 'Invalid enrollment request';
        toast.error(message);
        
        // If already enrolled, check enrollment status
        if (error.response.data.message?.includes('already enrolled')) {
          checkEnrollmentStatus();
        }
      } else if (error.response?.status >= 500) {
        // Server error
        toast.error('Server error occurred. Please try again later.');
      } else {
        // Network or other errors
        toast.error('Failed to enroll in course. Please check your connection.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleViewCourse = () => {
    navigate(`/courses/${courseId}/learn`);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'Not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
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

  if (!course) {
    return (
      <Container>
        <Alert severity="error">Course not found</Alert>
      </Container>
    );
  }

  // Ensure course has proper structure to prevent rendering errors
  const safeRating = course.rating || { average: 0, count: 0 };
  const safeInstructor = course.instructor || {};
  const safeModules = course.modules || [];
  const safeObjectives = course.objectives || [];
  const safePrerequisites = course.prerequisites || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Course Header */}
        <Grid item xs={12}>
          <Card>
            <Box position="relative">
              <CardMedia
                component="img"
                height="300"
                image={course.thumbnail || '/placeholder-course.jpg'}
                alt={course.title}
                sx={{ objectFit: 'cover' }}
              />
              <Box
                position="absolute"
                top={16}
                right={16}
                display="flex"
                gap={1}
              >
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<BookmarkBorder />}
                  sx={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Share />}
                  sx={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  Share
                </Button>
              </Box>
            </Box>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Box flex={1}>
                  <Typography variant="h4" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" paragraph>
                    {course.description}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      src={safeInstructor.profilePicture}
                      sx={{ width: 32, height: 32 }}
                    >
                      {safeInstructor.firstName?.[0]}
                    </Avatar>
                    <Typography variant="body2">
                      {safeInstructor.firstName} {safeInstructor.lastName}
                    </Typography>
                  </Box>
                    <Chip
                      label={course.category}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={course.level}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" alignItems="center" gap={3} mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Star color="warning" />
                      <Typography variant="body2">
                        {safeRating.average || 4.5} ({safeRating.count || 0} reviews)
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <People color="action" />
                      <Typography variant="body2">
                        {course.enrolledCount || 0} students
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Schedule color="action" />
                      <Typography variant="body2">
                        {formatDuration(course.duration)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h4" color="primary" gutterBottom>
                    {formatPrice(course.price, course.currency)}
                  </Typography>
                  {isEnrolled ? (
                    <Box>
                      <Chip
                        label={`Status: ${enrollment?.status || 'Active'}`}
                        color={getStatusColor(enrollment?.status)}
                        sx={{ mb: 2 }}
                      />
                      <Box>
                        {enrollment?.payment?.paymentStatus === 'pending' ? (
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<ShoppingCart />}
                            onClick={() => navigate(`/checkout/${enrollment._id}`)}
                            fullWidth
                            sx={{ mb: 2 }}
                          >
                            Complete Payment
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<PlayCircle />}
                            onClick={handleViewCourse}
                            fullWidth
                          >
                            Continue Learning
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<ShoppingCart />}
                      onClick={handleEnrollClick}
                      fullWidth
                    >
                      Enroll Now
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Course Content & Details */}
        <Grid item xs={12} md={8}>
          {/* What You'll Learn */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                What You'll Learn
              </Typography>
              <List>
                {safeObjectives.map((objective, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={objective} />
                  </ListItem>
                ))}
                {safeObjectives.length === 0 && (
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Complete understanding of the course material" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Course Content */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Content
              </Typography>
              <Box display="flex" alignItems="center" gap={3} mb={2}>
                <Typography variant="body2">
                  {safeModules.length || 5} modules
                </Typography>
                <Typography variant="body2">
                  {course.lessonsCount || 25} lessons
                </Typography>
                <Typography variant="body2">
                  {formatDuration(course.duration)} total
                </Typography>
              </Box>
              <List>
                {safeModules.map((module, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText
                      primary={module.title}
                      secondary={`${module.lessons?.length || 5} lessons • ${formatDuration(module.duration)}`}
                    />
                  </ListItem>
                ))}
                {safeModules.length === 0 && (
                  // Default content if no modules defined
                  Array.from({ length: 5 }, (_, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        <Assignment />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Module ${index + 1}: Course Content`}
                        secondary="5 lessons • 2h 30m"
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Student Reviews
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Rating value={safeRating.average || 4.5} precision={0.1} readOnly />
                <Typography variant="h6">{safeRating.average || 4.5}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ({safeRating.count || 0} reviews)
                </Typography>
              </Box>
              {reviews.map((review) => (
                <Paper key={review.id} sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar src={review.user.avatar}>
                      {review.user.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{review.user.name}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Rating value={review.rating} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="body2">{review.comment}</Typography>
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Course Features */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Features
              </Typography>
              <List>
                <ListItem sx={{ pl: 0 }}>
                  <ListItemIcon>
                    <AccessTime />
                  </ListItemIcon>
                  <ListItemText
                    primary="Duration"
                    secondary={formatDuration(course.duration)}
                  />
                </ListItem>
                <ListItem sx={{ pl: 0 }}>
                  <ListItemIcon>
                    <Language />
                  </ListItemIcon>
                  <ListItemText
                    primary="Language"
                    secondary={course.language || 'English'}
                  />
                </ListItem>
                <ListItem sx={{ pl: 0 }}>
                  <ListItemIcon>
                    <WorkspacePremium />
                  </ListItemIcon>
                  <ListItemText
                    primary="Certificate"
                    secondary="Upon completion"
                  />
                </ListItem>
                <ListItem sx={{ pl: 0 }}>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Access"
                    secondary="Lifetime"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          {safePrerequisites.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Prerequisites
                </Typography>
                <List>
                  {safePrerequisites.map((prereq, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        <School />
                      </ListItemIcon>
                      <ListItemText primary={prereq} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Instructor */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instructor
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                  src={safeInstructor.profilePicture}
                  sx={{ width: 60, height: 60 }}
                >
                  {safeInstructor.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {safeInstructor.firstName} {safeInstructor.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Course Instructor
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2">
                {safeInstructor.bio || 'Experienced instructor with expertise in the field.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={enrollmentDialog} onClose={() => setEnrollmentDialog(false)}>
        <DialogTitle>Confirm Enrollment</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to enroll in "{course.title}"?
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Total Amount:</Typography>
            <Typography variant="h6" color="primary">
              {formatPrice(course.price, course.currency)}
            </Typography>
          </Box>
          {course.price > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You will be redirected to the payment page after confirming enrollment.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollmentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleEnrollConfirm}
            variant="contained"
            disabled={enrolling}
          >
            {enrolling ? <CircularProgress size={20} /> : 'Confirm Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EnrollCourse;
