import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Profile = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
        User Profile
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Profile management page - Coming soon!
      </Typography>
    </Container>
  );
};

export default Profile; 