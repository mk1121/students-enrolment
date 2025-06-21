import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' }
  ];

  const renderNavItems = () => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {navItems.map((item) => (
        <Button
          key={item.path}
          component={Link}
          to={item.path}
          sx={{
            color: 'white',
            textDecoration: 'none',
            borderBottom: isActive(item.path) ? '2px solid white' : 'none',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );

  const renderAuthButtons = () => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        component={Link}
        to="/login"
        color="inherit"
        variant="outlined"
        sx={{ borderColor: 'white', color: 'white' }}
      >
        Login
      </Button>
      <Button
        component={Link}
        to="/register"
        variant="contained"
        sx={{ backgroundColor: 'white', color: 'primary.main' }}
      >
        Register
      </Button>
    </Box>
  );

  const renderUserMenu = () => (
    <>
      <IconButton
        onClick={handleUserMenuOpen}
        sx={{ color: 'white' }}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
          {user?.firstName?.charAt(0) || <PersonIcon />}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            navigate('/dashboard');
            handleUserMenuClose();
          }}
        >
          <DashboardIcon sx={{ mr: 1 }} />
          Dashboard
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate('/profile');
            handleUserMenuClose();
          }}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        {user?.role === 'admin' && (
          <MenuItem
            onClick={() => {
              navigate('/admin/dashboard');
              handleUserMenuClose();
            }}
          >
            <AdminIcon sx={{ mr: 1 }} />
            Admin Panel
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ fontSize: 32 }} />
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'white',
                fontWeight: 700
              }}
            >
              Students Enrollment
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {renderNavItems()}
              {isAuthenticated ? renderUserMenu() : renderAuthButtons()}
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Mobile Menu */}
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleMobileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                to={item.path}
                onClick={handleMobileMenuClose}
                selected={isActive(item.path)}
              >
                {item.label}
              </MenuItem>
            ))}
            {isAuthenticated ? (
              <>
                <MenuItem
                  onClick={() => {
                    navigate('/dashboard');
                    handleMobileMenuClose();
                  }}
                >
                  <DashboardIcon sx={{ mr: 1 }} />
                  Dashboard
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    navigate('/profile');
                    handleMobileMenuClose();
                  }}
                >
                  <SettingsIcon sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                {user?.role === 'admin' && (
                  <MenuItem
                    onClick={() => {
                      navigate('/admin/dashboard');
                      handleMobileMenuClose();
                    }}
                  >
                    <AdminIcon sx={{ mr: 1 }} />
                    Admin Panel
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem
                  component={Link}
                  to="/login"
                  onClick={handleMobileMenuClose}
                >
                  Login
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/register"
                  onClick={handleMobileMenuClose}
                >
                  Register
                </MenuItem>
              </>
            )}
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 