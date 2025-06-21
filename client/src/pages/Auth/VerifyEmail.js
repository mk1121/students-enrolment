import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError('An error occurred during verification.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, verifyEmail]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Verifying your email...</Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
          {success ? (
            <>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: 'success.main' }}>
                Email Verified!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your email has been successfully verified. You can now access all features of your account.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
                sx={{ mr: 2 }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Go to Home
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: 'error.main' }}>
                Verification Failed
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error || 'The verification link is invalid or has expired.'}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail; 