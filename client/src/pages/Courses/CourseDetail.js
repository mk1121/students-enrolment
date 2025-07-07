import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Rating,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  PlayCircleOutline,
  Schedule,
  Group,
  Language,
  CheckCircle,
  Star,
  Person,
  ExpandMore,
  School,
  Assignment,
  VideocamOutlined,
  AttachFileOutlined,
  ShoppingCart,
  Favorite,
  Share,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/api';
import { formatPrice } from '../../utils/currency';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentDialog, setEnrollmentDialog] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [similarCourses, setSimilarCourses] = useState([]);

  useEffect(() => {
    fetchCourseDetails();
    if (isAuthenticated) {
      checkEnrollmentStatus();
    }
  }, [id, isAuthenticated]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/courses/${id}`, {
        headers: {
          'Authorization': isAuthenticated ? `Bearer ${localStorage.getItem('token')}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      const data = await response.json();
      setCourse(data.course);

      // Fetch similar courses
      if (data.course.category) {
        fetchSimilarCourses(data.course.category, id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarCourses = async (category, excludeId) => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/courses?category=${category}&limit=4`
      );
      
      if (response.ok) {
        const data = await response.json();
        const filtered = data.courses.filter(c => c._id !== excludeId);
        setSimilarCourses(filtered.slice(0, 3));
      }
    } catch (err) {
      console.log('Failed to fetch similar courses:', err);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/enrollments/my-enrollments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const enrolled = data.enrollments.some(enrollment => 
          enrollment.course._id === id || enrollment.course === id
        );
        setIsEnrolled(enrolled);
      }
    } catch (err) {
      console.log('Failed to check enrollment status:', err);
    }
  };

  const handleEnrollment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(`${config.API_BASE_URL}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          courseId: id,
          paymentMethod: 'stripe', // Default payment method
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enroll in course');
      }

      const data = await response.json();
      
      // If payment is required, redirect to payment
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // Free course or already paid
        setIsEnrolled(true);
        setEnrollmentDialog(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const formatDuration = (hours) => {
    if (!hours || isNaN(hours) || hours <= 0) {
      return 'Duration not specified';
    }
    
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Course not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Course Header */}
          <Card sx={{ mb: 3 }}>
            {course.thumbnail && (
              <CardMedia
                component="img"
                height="300"
                image={course.thumbnail}
                alt={course.title}
                sx={{ objectFit: 'cover' }}
              />
            )}
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip label={course.category} color="primary" size="small" />
                <Chip label={course.level} variant="outlined" size="small" />
                {course.isFeatured && (
                  <Chip label="Featured" color="secondary" size="small" />
                )}
              </Box>

              <Typography variant="h4" component="h1" gutterBottom>
                {course.title}
              </Typography>

              <Typography variant="body1" color="text.secondary" paragraph>
                {course.shortDescription || course.description}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <Person />
                  </Avatar>
                  <Typography variant="body2">
                    {course.instructor?.name || 'Instructor'}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Rating value={course.rating?.average || 0} readOnly size="small" />
                  <Typography variant="body2">
                    ({course.rating?.count || 0} reviews)
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Group fontSize="small" />
                  <Typography variant="body2">
                    {course.currentStudents} students
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Schedule fontSize="small" />
                <Typography variant="body2">
                  {formatDuration(course.duration)}
                </Typography>
                
                <Language fontSize="small" />
                <Typography variant="body2">English</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Course Content Tabs */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About This Course
              </Typography>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* Learning Outcomes */}
              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    What You'll Learn
                  </Typography>
                  <List>
                    {course.learningOutcomes.map((outcome, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={outcome} />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 3 }} />
                </>
              )}

              {/* Course Requirements */}
              {course.requirements && course.requirements.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Requirements
                  </Typography>
                  <List>
                    {course.requirements.map((requirement, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Assignment />
                        </ListItemIcon>
                        <ListItemText primary={requirement} />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 3 }} />
                </>
              )}

              {/* Course Syllabus */}
              {course.syllabus && course.syllabus.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Course Content
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {course.syllabus.length} sections
                  </Typography>
                  
                  {course.syllabus.map((section, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" gap={1} width="100%">
                          <Typography variant="subtitle1">
                            {section.title}
                          </Typography>
                          {section.duration && (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                              {section.duration} min
                            </Typography>
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" paragraph>
                          {section.description}
                        </Typography>
                        
                        {section.videoUrl && (
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <VideocamOutlined fontSize="small" />
                            <Typography variant="body2">Video Lesson</Typography>
                          </Box>
                        )}
                        
                        {section.materials && section.materials.length > 0 && (
                          <Box>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              Materials:
                            </Typography>
                            {section.materials.map((material, materialIndex) => (
                              <Box key={materialIndex} display="flex" alignItems="center" gap={1} mb={0.5}>
                                <AttachFileOutlined fontSize="small" />
                                <Typography variant="body2">{material}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  <Divider sx={{ my: 3 }} />
                </>
              )}

              {/* Instructor */}
              {course.instructor && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Instructor
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ width: 60, height: 60 }}>
                      {course.instructor.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{course.instructor.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.instructor.email}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              {/* Preview Video */}
              {course.videoUrl && (
                <Box mb={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PlayCircleOutline />}
                    sx={{ mb: 2 }}
                  >
                    Preview Course
                  </Button>
                </Box>
              )}

              {/* Price */}
              <Box mb={3}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {course.discount > 0 ? (
                    <>
                      <Typography variant="h4" color="primary">
                        {formatPrice(course.discountedPrice || course.price, course.currency || 'BDT')}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ textDecoration: 'line-through' }}
                        color="text.secondary"
                      >
                        {formatPrice(course.price, course.currency || 'BDT')}
                      </Typography>
                      <Chip 
                        label={`${course.discount}% OFF`} 
                        color="error" 
                        size="small" 
                      />
                    </>
                  ) : (
                    <Typography variant="h4" color="primary">
                      {course.price === 0 ? 'Free' : formatPrice(course.price, course.currency || 'BDT')}
                    </Typography>
                  )}
                </Box>

                {course.enrollmentDeadline && (
                  <Typography variant="body2" color="warning.main">
                    Enrollment ends: {new Date(course.enrollmentDeadline).toLocaleDateString()}
                  </Typography>
                )}
              </Box>

              {/* Enrollment Progress */}
              {course.maxStudents > 0 && (
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {course.currentStudents || 0} / {course.maxStudents} enrolled
                    </Typography>
                    <Typography variant="body2">
                      {Math.round(((course.currentStudents || 0) / course.maxStudents) * 100) || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.round(((course.currentStudents || 0) / course.maxStudents) * 100) || 0} 
                    sx={{ mb: 1 }}
                  />
                </Box>
              )}

              {/* Action Buttons */}
              <Box display="flex" flexDirection="column" gap={2}>
                {isEnrolled ? (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<School />}
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Course
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ShoppingCart />}
                    onClick={handleEnrollment}
                    disabled={enrolling || (course.maxStudents > 0 && course.currentStudents >= course.maxStudents)}
                  >
                    {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                  </Button>
                )}

                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Favorite />}
                    fullWidth
                  >
                    Wishlist
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    fullWidth
                  >
                    Share
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Course Info */}
              <Typography variant="h6" gutterBottom>
                Course Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Schedule fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Duration" 
                    secondary={formatDuration(course.duration)} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Group fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Students" 
                    secondary={course.currentStudents || 0} 
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Language fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Language" 
                    secondary="English" 
                  />
                </ListItem>

                {course.certificate && (
                  <ListItem>
                    <ListItemIcon>
                      <School fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Certificate" 
                      secondary="Certificate of completion" 
                    />
                  </ListItem>
                )}
              </List>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {course.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Similar Courses */}
          {similarCourses.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Similar Courses
                </Typography>
                {similarCourses.map((similarCourse) => (
                  <Box key={similarCourse._id} mb={2}>
                    <Card variant="outlined" sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/courses/${similarCourse._id}`)}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {similarCourse.title}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            {similarCourse.instructor?.name}
                          </Typography>                        <Typography variant="body2" fontWeight="bold">
                          {similarCourse.price === 0 ? 'Free' : formatPrice(similarCourse.price, similarCourse.currency || 'BDT')}
                        </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Enrollment Success Dialog */}
      <Dialog open={enrollmentDialog} onClose={() => setEnrollmentDialog(false)}>
        <DialogTitle>Enrollment Successful!</DialogTitle>
        <DialogContent>
          <Typography>
            You have successfully enrolled in {course.title}. 
            You can now access the course content from your dashboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollmentDialog(false)}>
            Continue Browsing
          </Button>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseDetail; 