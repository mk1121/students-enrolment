import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Admin dashboard - Coming soon!
      </Typography>
    </Container>
  );
};

export default AdminDashboard; 