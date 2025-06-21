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
- **Email**: Nodemailer
- **Security**: bcryptjs, helmet, rate limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Stripe account (for payment processing)

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
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/students-enrollment
   JWT_SECRET=your_jwt_secret_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

5. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or run separately
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
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
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── package.json
└── server.js
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