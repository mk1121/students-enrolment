import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminUsers = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        Admin - User Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        User management page - Coming soon!
      </Typography>
    </Container>
  );
};

export default AdminUsers; 