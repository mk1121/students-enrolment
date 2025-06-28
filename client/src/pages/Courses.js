import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Courses = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        All Courses
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Course listing page - Coming soon!
      </Typography>
    </Container>
  );
};

export default Courses; 