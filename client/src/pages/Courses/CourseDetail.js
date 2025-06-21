import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const CourseDetail = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        Course Details
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Course detail page - Coming soon!
      </Typography>
    </Container>
  );
};

export default CourseDetail; 