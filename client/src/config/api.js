// API Configuration
const config = {
  // API Base URL - automatically detects environment
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || 'https://project-dev-std-enroll.maruf.com.bd/api'
    : process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  
  // Client URL
  CLIENT_URL: process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_CLIENT_URL || window.location.origin
    : process.env.REACT_APP_CLIENT_URL || 'http://localhost:3000'
};

export default config;
