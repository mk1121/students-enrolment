import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';

// Mock the AuthContext
const mockAuthContext = {
  loading: false,
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

jest.mock('./context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children,
}));

// Mock all page components to avoid complex dependency chains
jest.mock('./pages/Home', () => {
  return function Home() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('./pages/Auth/Login', () => {
  return function Login() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('./pages/Auth/Register', () => {
  return function Register() {
    return <div data-testid="register-page">Register Page</div>;
  };
});

jest.mock('./pages/Auth/ForgotPassword', () => {
  return function ForgotPassword() {
    return <div data-testid="forgot-password-page">Forgot Password Page</div>;
  };
});

jest.mock('./pages/Auth/ResetPassword', () => {
  return function ResetPassword() {
    return <div data-testid="reset-password-page">Reset Password Page</div>;
  };
});

jest.mock('./pages/Auth/VerifyEmail', () => {
  return function VerifyEmail() {
    return <div data-testid="verify-email-page">Verify Email Page</div>;
  };
});

jest.mock('./pages/Courses', () => {
  return function Courses() {
    return <div data-testid="courses-page">Courses Page</div>;
  };
});

jest.mock('./pages/Courses/CourseDetail', () => {
  return function CourseDetail() {
    return <div data-testid="course-detail-page">Course Detail Page</div>;
  };
});

jest.mock('./pages/Dashboard', () => {
  return function Dashboard() {
    return <div data-testid="dashboard-page">Dashboard Page</div>;
  };
});

jest.mock('./pages/Profile', () => {
  return function Profile() {
    return <div data-testid="profile-page">Profile Page</div>;
  };
});

jest.mock('./pages/Admin/Dashboard', () => {
  return function AdminDashboard() {
    return <div data-testid="admin-dashboard-page">Admin Dashboard Page</div>;
  };
});

jest.mock('./pages/Admin/Courses', () => {
  return function AdminCourses() {
    return <div data-testid="admin-courses-page">Admin Courses Page</div>;
  };
});

jest.mock('./pages/Admin/Users', () => {
  return function AdminUsers() {
    return <div data-testid="admin-users-page">Admin Users Page</div>;
  };
});

jest.mock('./pages/Admin/Enrollments', () => {
  return function AdminEnrollments() {
    return <div data-testid="admin-enrollments-page">Admin Enrollments Page</div>;
  };
});

jest.mock('./pages/Admin/Payments', () => {
  return function AdminPayments() {
    return <div data-testid="admin-payments-page">Admin Payments Page</div>;
  };
});

jest.mock('./components/Layout/Layout', () => {
  return function Layout({ children }) {
    const { Outlet } = require('react-router-dom');
    return (
      <div data-testid="layout">
        {children}
        <Outlet />
      </div>
    );
  };
});

jest.mock('./components/Auth/ProtectedRoute', () => {
  return function ProtectedRoute({ children }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

jest.mock('./components/Auth/AdminRoute', () => {
  return function AdminRoute({ children }) {
    return <div data-testid="admin-route">{children}</div>;
  };
});

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
  });

  test('renders home page by default', () => {
    renderWithProviders(<App />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('renders with layout component', () => {
    renderWithProviders(<App />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });
});
