# Students Online Enrollment System

A comprehensive web application for student enrollment management with integrated payment gateways, built using the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### For Students
- User registration and authentication
- Browse available courses
- Enroll in courses with secure payment processing
- View enrollment history and course progress
- Profile management
- Course materials access

### For Administrators
- Course management (CRUD operations)
- Student enrollment management
- Payment tracking and management
- User management
- Analytics dashboard
- Email notifications

### Payment Integration
- Stripe payment gateway integration
- Secure payment processing
- Payment history tracking
- Refund management

## Tech Stack

- **Frontend**: React.js, Material-UI, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe API
- **Email**: Nodemailer with Gmail OAuth 2.0
- **Security**: bcryptjs, helmet, rate limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Stripe account (for payment processing)
- Gmail account (for email functionality)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd students-enrollment-system
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/students-enrollment
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   CLIENT_URL=http://localhost:3000
   
   # Email Configuration (OAuth 2.0 - Recommended)
   EMAIL_USER=your-email@gmail.com
   EMAIL_FROM=noreply@yourdomain.com
   GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-gmail-client-secret
   GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

   **📧 Email Setup**: For email functionality, you'll need to set up Gmail OAuth 2.0. See [`docs/GMAIL_OAUTH_SETUP.md`](docs/GMAIL_OAUTH_SETUP.md) for detailed instructions.

5. **Test Email Configuration (Optional)**
   ```bash
   # Test your OAuth 2.0 email setup
   node test-email-oauth.js
   
   # Check environment variables
   node test-email-oauth.js --env
   
   # Show help
   node test-email-oauth.js --help
   ```

6. **Create Admin User**
   ```bash
   # Interactive admin creation
   node create-admin-interactive.js
   
   # Or use the simple script
   node create-admin.js
   ```

7. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or run separately
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

8. **Run Tests**
   ```bash
   # Run all tests
   npm test
   
   # Run tests with coverage
   npm run test:coverage
   
   # Run tests in watch mode
   npm run test:watch
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Create enrollment
- `PUT /api/enrollments/:id` - Update enrollment status

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments` - Get payment history

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Project Structure

```
students-enrollment-system/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── utils/
│       └── App.js
├── server/                 # Node.js backend
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── tests/                  # Test suites
│   ├── integration/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── helpers/
├── docs/                   # Documentation
├── package.json
└── server.js
```

## Email Templates

The system includes beautiful, responsive email templates for:
- Welcome emails
- Course enrollment confirmations
- Payment confirmations
- Course completion certificates
- Password reset requests
- Email verification

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- OAuth 2.0 for email security

## Testing

The project includes comprehensive test coverage:
- **84 tests** across all components
- Model validation tests
- Authentication middleware tests
- API endpoint tests
- Integration tests

Run tests with:
```bash
npm test                # Run all tests
npm run test:coverage   # Generate coverage report
npm run test:watch      # Watch mode for development
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or create an issue in the repository. 