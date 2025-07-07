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
  LinearProgress,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  ExpandMore,
  Download,
  Share,
  BookmarkBorder,
  Bookmark,
  Quiz,
  Assignment,
  VideoLibrary,
  Description,
  AccessTime,
  Certificate,
  Star,
  EmojiEvents,
  School,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const CourseProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [expandedModules, setExpandedModules] = useState([]);
  const [bookmarkedLessons, setBookmarkedLessons] = useState([]);
  const [certificateDialog, setCertificateDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseProgress();
    }
  }, [courseId, fetchCourseProgress]);

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
        setCompletedLessons(userEnrollment.completedLessons || []);
        
        // Set first incomplete lesson as current
        const allLessons = getAllLessons(courseResponse.data.course);
        const firstIncompleteLesson = allLessons.find(
          lesson => !userEnrollment.completedLessons?.some(
            completed => completed.lessonId === lesson.id
          )
        );
        
        if (firstIncompleteLesson) {
          setCurrentLesson(firstIncompleteLesson);
        } else if (allLessons.length > 0) {
          setCurrentLesson(allLessons[0]);
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
  }, [courseId, navigate]);

  const getAllLessons = (course) => {
    const lessons = [];
    course.modules?.forEach((module, moduleIndex) => {
      module.lessons?.forEach((lesson, lessonIndex) => {
        lessons.push({
          ...lesson,
          id: `${moduleIndex}-${lessonIndex}`,
          moduleIndex,
          lessonIndex,
          moduleTitle: module.title,
        });
      });
    });
    return lessons;
  };

  const handleModuleToggle = (moduleIndex) => {
    setExpandedModules(prev => 
      prev.includes(moduleIndex)
        ? prev.filter(index => index !== moduleIndex)
        : [...prev, moduleIndex]
    );
  };

  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson);
  };

  const handleMarkComplete = async (lesson) => {
    try {
      await axios.put(`/enrollments/${enrollment._id}/lesson/${lesson.id}/complete`);
      
      setCompletedLessons(prev => [
        ...prev.filter(completed => completed.lessonId !== lesson.id),
        { lessonId: lesson.id, completedAt: new Date() }
      ]);
      
      // Update enrollment progress
      const allLessons = getAllLessons(course);
      const newCompletedCount = completedLessons.length + 1;
      const newProgress = Math.round((newCompletedCount / allLessons.length) * 100);
      
      setEnrollment(prev => ({
        ...prev,
        progress: newProgress
      }));
      
      toast.success('Lesson marked as complete!');
      
      // Check if course is completed
      if (newProgress === 100) {
        setCertificateDialog(true);
      }
      
    } catch (error) {
      toast.error('Failed to mark lesson as complete');
    }
  };

  const handleBookmarkToggle = async (lesson) => {
    try {
      const isBookmarked = bookmarkedLessons.includes(lesson.id);
      
      if (isBookmarked) {
        await axios.delete(`/enrollments/${enrollment._id}/bookmark/${lesson.id}`);
        setBookmarkedLessons(prev => prev.filter(id => id !== lesson.id));
        toast.success('Bookmark removed');
      } else {
        await axios.post(`/enrollments/${enrollment._id}/bookmark/${lesson.id}`);
        setBookmarkedLessons(prev => [...prev, lesson.id]);
        toast.success('Lesson bookmarked');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const response = await axios.get(
        `/enrollments/${enrollment._id}/certificate`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${course.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.some(completed => completed.lessonId === lessonId);
  };

  const isLessonBookmarked = (lessonId) => {
    return bookmarkedLessons.includes(lessonId);
  };

  const getLessonIcon = (lesson) => {
    switch (lesson.type) {
      case 'video':
        return <VideoLibrary />;
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <Assignment />;
      case 'reading':
        return <Description />;
      default:
        return <PlayArrow />;
    }
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
        <Alert severity="error">Course or enrollment not found</Alert>
      </Container>
    );
  }

  const allLessons = getAllLessons(course);
  const completedCount = completedLessons.length;
  const progressPercentage = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Course Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {course.title}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar src={course.instructor?.profilePicture}>
                      {course.instructor?.firstName?.[0]}
                    </Avatar>
                    <Typography variant="body1">
                      {course.instructor?.firstName} {course.instructor?.lastName}
                    </Typography>
                    <Chip label={course.category} size="small" />
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <IconButton onClick={() => setShareDialog(true)}>
                    <Share />
                  </IconButton>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleDownloadCertificate}
                    disabled={enrollment.status !== 'completed'}
                  >
                    Certificate
                  </Button>
                </Box>
              </Box>
              
              {/* Progress Section */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Course Progress</Typography>
                  <Typography variant="h6" color="primary">
                    {progressPercentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{ height: 12, borderRadius: 6, mb: 2 }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="primary">
                        {completedCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lessons Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h5">
                        {allLessons.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Lessons
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h5">
                        {enrollment.score || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Current Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h5">
                        {formatDuration(course.duration)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Duration
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Achievement Badges */}
              {enrollment.status === 'completed' && (
                <Box display="flex" gap={2} mb={2}>
                  <Chip
                    icon={<EmojiEvents />}
                    label="Course Completed"
                    color="success"
                    variant="outlined"
                  />
                  {enrollment.certificate?.issued && (
                    <Chip
                      icon={<Certificate />}
                      label="Certificate Earned"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {enrollment.score >= 90 && (
                    <Chip
                      icon={<Star />}
                      label="Excellent Performance"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Course Content */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content', maxHeight: '80vh', overflow: 'auto' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Content
              </Typography>
              
              {course.modules?.map((module, moduleIndex) => (
                <Accordion
                  key={moduleIndex}
                  expanded={expandedModules.includes(moduleIndex)}
                  onChange={() => handleModuleToggle(moduleIndex)}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Typography variant="subtitle1" flex={1}>
                        {module.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {module.lessons?.length || 0} lessons
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List dense>
                      {module.lessons?.map((lesson, lessonIndex) => {
                        const lessonId = `${moduleIndex}-${lessonIndex}`;
                        const completed = isLessonCompleted(lessonId);
                        const bookmarked = isLessonBookmarked(lessonId);
                        const isCurrentLesson = currentLesson?.id === lessonId;
                        
                        return (
                          <ListItemButton
                            key={lessonIndex}
                            selected={isCurrentLesson}
                            onClick={() => handleLessonSelect({
                              ...lesson,
                              id: lessonId,
                              moduleIndex,
                              lessonIndex,
                              moduleTitle: module.title,
                            })}
                          >
                            <ListItemIcon>
                              {completed ? (
                                <CheckCircle color="success" />
                              ) : (
                                getLessonIcon(lesson)
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={lesson.title}
                              secondary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <AccessTime sx={{ fontSize: 12 }} />
                                  <Typography variant="caption">
                                    {formatDuration(lesson.duration)}
                                  </Typography>
                                  {bookmarked && (
                                    <Bookmark sx={{ fontSize: 12 }} color="primary" />
                                  )}
                                </Box>
                              }
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Lesson Content */}
        <Grid item xs={12} md={8}>
          {currentLesson ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {currentLesson.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {currentLesson.moduleTitle}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Tooltip title={isLessonBookmarked(currentLesson.id) ? "Remove bookmark" : "Bookmark lesson"}>
                      <IconButton onClick={() => handleBookmarkToggle(currentLesson)}>
                        {isLessonBookmarked(currentLesson.id) ? <Bookmark color="primary" /> : <BookmarkBorder />}
                      </IconButton>
                    </Tooltip>
                    {!isLessonCompleted(currentLesson.id) && (
                      <Button
                        variant="contained"
                        startIcon={<CheckCircle />}
                        onClick={() => handleMarkComplete(currentLesson)}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Lesson Content Area */}
                <Paper sx={{ p: 3, minHeight: 400, mb: 3 }}>
                  {currentLesson.type === 'video' && (
                    <Box textAlign="center">
                      <VideoLibrary sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Video Lesson
                      </Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        {currentLesson.description || 'Video content would be displayed here.'}
                      </Typography>
                      <Button variant="contained" startIcon={<PlayArrow />} size="large">
                        Play Video
                      </Button>
                    </Box>
                  )}
                  
                  {currentLesson.type === 'reading' && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Reading Material
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {currentLesson.content || currentLesson.description || 'Reading content would be displayed here.'}
                      </Typography>
                    </Box>
                  )}
                  
                  {currentLesson.type === 'quiz' && (
                    <Box textAlign="center">
                      <Quiz sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Quiz
                      </Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        {currentLesson.description || 'Quiz content would be displayed here.'}
                      </Typography>
                      <Button variant="contained" startIcon={<Quiz />} size="large">
                        Start Quiz
                      </Button>
                    </Box>
                  )}
                  
                  {currentLesson.type === 'assignment' && (
                    <Box textAlign="center">
                      <Assignment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Assignment
                      </Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        {currentLesson.description || 'Assignment content would be displayed here.'}
                      </Typography>
                      <Button variant="contained" startIcon={<Assignment />} size="large">
                        View Assignment
                      </Button>
                    </Box>
                  )}
                </Paper>

                {/* Lesson Navigation */}
                <Box display="flex" justifyContent="space-between">
                  <Button
                    variant="outlined"
                    disabled={!currentLesson || currentLesson.lessonIndex === 0}
                    onClick={() => {
                      const prevLesson = allLessons.find(lesson => 
                        lesson.moduleIndex === currentLesson.moduleIndex && 
                        lesson.lessonIndex === currentLesson.lessonIndex - 1
                      );
                      if (prevLesson) handleLessonSelect(prevLesson);
                    }}
                  >
                    Previous Lesson
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!currentLesson || currentLesson.lessonIndex === (course.modules?.[currentLesson.moduleIndex]?.lessons?.length - 1)}
                    onClick={() => {
                      const nextLesson = allLessons.find(lesson => 
                        lesson.moduleIndex === currentLesson.moduleIndex && 
                        lesson.lessonIndex === currentLesson.lessonIndex + 1
                      );
                      if (nextLesson) handleLessonSelect(nextLesson);
                    }}
                  >
                    Next Lesson
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Select a lesson to continue
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a lesson from the course content to start learning.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Certificate Dialog */}
      <Dialog open={certificateDialog} onClose={() => setCertificateDialog(false)}>
        <DialogTitle>🎉 Congratulations!</DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            <EmojiEvents sx={{ fontSize: 80, color: 'gold', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Course Completed Successfully!
            </Typography>
            <Typography variant="body1" paragraph>
              You have successfully completed "{course.title}". Your certificate is ready for download.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificateDialog(false)}>Close</Button>
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
      <Dialog open={shareDialog} onClose={() => setShareDialog(false)}>
        <DialogTitle>Share Progress</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Share your learning progress with friends and colleagues!
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button variant="outlined">Facebook</Button>
            <Button variant="outlined">Twitter</Button>
            <Button variant="outlined">LinkedIn</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseProgress;
