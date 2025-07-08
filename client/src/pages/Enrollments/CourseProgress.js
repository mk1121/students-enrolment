import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  LinearProgress,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Download,
  Share,
  AccessTime,
  WorkspacePremium,
  Star,
  EmojiEvents,
  School,
  Bookmark,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const CourseProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [bookmarkedLessons] = useState([]);
  const [certificateDialog, setCertificateDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);

  // Helper function to get all lessons
  const getAllLessons = useCallback((course) => {
    if (!course || !course.curriculum) return [];
    return course.curriculum.reduce((lessons, module) => {
      return lessons.concat(module.lessons || []);
    }, []);
  }, []);

  const fetchCourseProgress = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
      setCourse(courseResponse.data.course);
      
      // Fetch enrollment details
      const enrollmentResponse = await axios.get(`${API_BASE_URL}/enrollments/my-enrollments`);
      const userEnrollment = enrollmentResponse.data.enrollments.find(
        (enrollment) => enrollment.course._id === courseId
      );
      
      if (userEnrollment) {
        setEnrollment(userEnrollment);
        
        // Set up mock progress data
        const totalLessons = getAllLessons(courseResponse.data.course).length;
        const completed = Math.floor(Math.random() * totalLessons);
        setCompletedLessons(Array.from({ length: completed }, (_, i) => `lesson-${i}`));
        
        // Set first incomplete lesson as current
        const allLessons = getAllLessons(courseResponse.data.course);
        const firstIncompleteLesson = allLessons.find(
          lesson => !userEnrollment.completedLessons?.some(
            completed => completed.lessonId === lesson.id
          )
        );
        
        if (firstIncompleteLesson) {
          // setCurrentLesson would be used here in a real implementation
        } else if (allLessons.length > 0) {
          // setCurrentLesson would be used here in a real implementation
        }
      } else {
        // User not enrolled
        navigate(`/courses/${courseId}`);
        return;
      }
      
    } catch (error) {
      toast.error('Failed to fetch course progress');
      console.error('Error fetching course progress:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate, getAllLessons]);

  useEffect(() => {
    if (courseId) {
      fetchCourseProgress();
    }
  }, [courseId, fetchCourseProgress]);

  const handleDownloadCertificate = () => {
    // Mock certificate download
    toast.info('Certificate download would be implemented here');
    setCertificateDialog(false);
  };

  const handleShareProgress = () => {
    if (navigator.share) {
      navigator.share({
        title: `My progress in ${course.title}`,
        text: `I've completed ${enrollment.progress}% of ${course.title}!`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success('Course link copied to clipboard!');
    }
    setShareDialog(false);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  if (!course || !enrollment) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Course not found or you are not enrolled in this course.
        </Alert>
      </Container>
    );
  }

  const progressPercentage = enrollment.progress || 0;
  const totalLessons = getAllLessons(course).length;
  const completedCount = completedLessons.length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Course Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {course.description}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Chip
                icon={<School />}
                label={`${completedCount}/${totalLessons} lessons completed`}
                color="primary"
              />
              <Chip
                icon={<AccessTime />}
                label={formatDuration(course.duration)}
                variant="outlined"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="body2" color="text.secondary">
                Progress: {progressPercentage}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => setShareDialog(true)}
                fullWidth
              >
                Share Progress
              </Button>
              {progressPercentage === 100 && (
                <Button
                  variant="contained"
                  startIcon={<WorkspacePremium />}
                  onClick={() => setCertificateDialog(true)}
                  color="success"
                  fullWidth
                >
                  Get Certificate
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Course Content Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Course Content
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a demo course progress page. In a real application, this would show actual course modules and lessons.
            </Alert>

            {/* Mock course content */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Module 1: Introduction
              </Typography>
              <List>
                <ListItemButton>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Welcome to the Course" secondary="5 minutes" />
                </ListItemButton>
                <ListItemButton>
                  <ListItemIcon>
                    <PlayArrow />
                  </ListItemIcon>
                  <ListItemText primary="Course Overview" secondary="10 minutes" />
                </ListItemButton>
              </List>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Lesson
            </Typography>
            <Alert severity="info">
              Select a lesson to start learning
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      {/* Achievement Stats */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Achievements
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <EmojiEvents />
              </Avatar>
              <Typography variant="h6">{completedCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Lessons Completed
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                <Star />
              </Avatar>
              <Typography variant="h6">{progressPercentage}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Course Progress
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <Bookmark />
              </Avatar>
              <Typography variant="h6">{bookmarkedLessons.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Bookmarked Lessons
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Certificate Dialog */}
      <Dialog
        open={certificateDialog}
        onClose={() => setCertificateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <WorkspacePremium color="success" />
            Congratulations!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            You have successfully completed "{course.title}"! You can now download your certificate of completion.
          </Typography>
          <Alert severity="success" sx={{ mt: 2 }}>
            Your certificate is ready for download. Share your achievement with the world!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificateDialog(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadCertificate}
          >
            Download Certificate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialog}
        onClose={() => setShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Your Progress</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Share your learning progress with friends and colleagues!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Progress: {progressPercentage}% of "{course.title}"
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Share />}
            onClick={handleShareProgress}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseProgress;
