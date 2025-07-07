const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Import routes
const authRoutes = require('./server/routes/auth');
const courseRoutes = require('./server/routes/courses');
const enrollmentRoutes = require('./server/routes/enrollments');
const paymentRoutes = require('./server/routes/payments');
const sslcommerzRoutes = require('./server/routes/sslcommerz');
const userRoutes = require('./server/routes/users');

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint to check if server is running
app.get('/', (req, res) => {
  res.json({
    message: 'Students Enrollment System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      payments: '/api/payments',
      users: '/api/users',
    },
  });
});

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        // Development origins
        'http://localhost:3000',
        'http://localhost:3001',

        // Production origins
        'https://mk1121.github.io', // GitHub Pages production
        'https://project-dev-std-enroll.maruf.com.bd', // Custom domain

        // Environment-specific origins
        process.env.CLIENT_URL, // Production client URL from env
        process.env.FRONTEND_URL, // Alternative env var name

        // Add any additional domains here
      ].filter(Boolean); // Remove any undefined/null values

      console.log(
        `CORS Check - Origin: ${origin}, Environment: ${process.env.NODE_ENV}`
      );

      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Origin ${origin} allowed`);
        callback(null, true);
      } else {
        // In development, be more permissive but log warnings
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `⚠️ CORS: Origin ${origin} not in whitelist but allowing in ${process.env.NODE_ENV} mode`
          );
          callback(null, true);
        } else {
          console.log(`❌ CORS: Origin ${origin} blocked in production`);
          callback(
            new Error(`CORS: Origin ${origin} not allowed in production`)
          );
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-Access-Token',
    ],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// Database connection
mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/students-enrollment',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Health check endpoint (must be before catch-all route)
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version:
      process.env.npm_package_version ||
      process.env.BUN_PACKAGE_VERSION ||
      '1.0.0',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
  };

  res.status(200).json(healthCheck);
});

// Basic metrics endpoint (for monitoring)
app.get('/api/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    database: {
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(metrics);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments/sslcommerz', sslcommerzRoutes);
app.use('/api/users', userRoutes);

// Method not allowed handler for API routes (must be after all specific routes)

app.all('/api/*', (req, res) => {
  res.status(405).json({
    message: `Method ${req.method} not allowed for ${req.path}`,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
