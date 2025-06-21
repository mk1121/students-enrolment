import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';
import Courses from './pages/Courses';
import CourseDetail from './pages/Courses/CourseDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCourses from './pages/Admin/Courses';
import AdminUsers from './pages/Admin/Users';
import AdminEnrollments from './pages/Admin/Enrollments';
import AdminPayments from './pages/Admin/Payments';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="login" element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="register" element={
          !isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="forgot-password" element={
          !isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="reset-password/:token" element={
          !isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="verify-email/:token" element={<VerifyEmail />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<Layout />}>
        <Route path="dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="courses" element={
          <AdminRoute>
            <AdminCourses />
          </AdminRoute>
        } />
        <Route path="users" element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } />
        <Route path="enrollments" element={
          <AdminRoute>
            <AdminEnrollments />
          </AdminRoute>
        } />
        <Route path="payments" element={
          <AdminRoute>
            <AdminPayments />
          </AdminRoute>
        } />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 