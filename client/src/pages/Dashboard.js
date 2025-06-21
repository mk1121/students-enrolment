import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Dashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        Student Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Student dashboard - Coming soon!
      </Typography>
    </Container>
  );
};

export default Dashboard; 