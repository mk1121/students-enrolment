import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminEnrollments = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        Admin - Enrollment Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Enrollment management page - Coming soon!
      </Typography>
    </Container>
  );
};

export default AdminEnrollments; 