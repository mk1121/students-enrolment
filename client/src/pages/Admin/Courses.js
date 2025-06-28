import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminCourses = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        Admin - Course Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Course management page - Coming soon!
      </Typography>
    </Container>
  );
};

export default AdminCourses; 