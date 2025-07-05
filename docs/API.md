# 🔌 API Documentation
## Students Enrollment System - REST API Reference

---

## 📋 Table of Contents

- [🔐 Authentication](#-authentication)
- [📚 Courses API](#-courses-api)
- [👥 Users API](#-users-api)
- [📝 Enrollments API](#-enrollments-api)
- [💳 Payments API](#-payments-api)
- [🏪 SSLCommerz Payment Gateway](#-sslcommerz-payment-gateway)
- [🔧 System API](#-system-api)
- [📊 Error Handling](#-error-handling)
- [📋 Rate Limiting](#-rate-limiting)

---

## 🔐 Authentication

### Base URL
```
Production: https://your-api.render.com/api
Development: http://localhost:5001/api
```

### Authentication Methods

#### JWT Token Authentication
Include JWT token in the Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

#### Token Expiry
Tokens expire in 7 days. Currently no refresh mechanism is implemented.

---

## 👤 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "address": {
    "street": "123 Main St", 
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

---

## 📚 Courses API

### Get All Courses
```http
GET /courses
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `search` (string): Search in title and description
- `category` (string): Filter by category
- `level` (string): Filter by difficulty level
- `status` (string): Filter by status (`active`, `draft`, `archived`)
- `sort` (string): Sort by field (`title`, `price`, `createdAt`, `enrollments`)
- `order` (string): Sort order (`asc`, `desc`)

**Example Request:**
```http
GET /courses?page=1&limit=10&search=javascript&category=programming&sort=enrollments&order=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "64f123abc456def789012345",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript from basics to advanced concepts",
        "category": "Programming",
        "level": "Beginner",
        "price": 99.99,
        "duration": "6 weeks",
        "instructor": {
          "id": "64f123abc456def789012346",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "thumbnail": "https://example.com/course-thumbnail.jpg",
        "enrollmentCount": 145,
        "rating": 4.7,
        "status": "active",
        "tags": ["javascript", "web-development", "programming"],
        "createdAt": "2023-09-01T10:00:00.000Z",
        "updatedAt": "2023-09-15T14:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Course by ID
```http
GET /courses/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "64f123abc456def789012345",
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript from basics to advanced concepts",
      "fullDescription": "Comprehensive course covering...",
      "category": "Programming",
      "level": "Beginner",
      "price": 99.99,
      "originalPrice": 149.99,
      "discount": 33,
      "duration": "6 weeks",
      "totalLessons": 24,
      "instructor": {
        "id": "64f123abc456def789012346",
        "name": "Jane Smith",
        "bio": "Experienced web developer with 10+ years",
        "avatar": "https://example.com/instructor-avatar.jpg"
      },
      "curriculum": [
        {
          "module": "Introduction",
          "lessons": [
            "What is JavaScript?",
            "Setting up the environment",
            "Your first JavaScript program"
          ]
        }
      ],
      "requirements": [
        "Basic computer knowledge",
        "No programming experience required"
      ],
      "whatYouWillLearn": [
        "JavaScript fundamentals",
        "DOM manipulation",
        "Async programming"
      ],
      "materials": [
        {
          "type": "video",
          "title": "Introduction Video",
          "url": "https://example.com/video1.mp4",
          "duration": "15:30"
        }
      ],
      "enrollmentCount": 145,
      "rating": 4.7,
      "reviews": 89,
      "tags": ["javascript", "web-development"],
      "isEnrolled": false,
      "createdAt": "2023-09-01T10:00:00.000Z"
    }
  }
}
```

### Get Featured Courses
```http
GET /courses/featured
```

**Response (200):**
```json
{
  "courses": [
    {
      "id": "64f123abc456def789012345",
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript from basics to advanced concepts",
      "category": "Programming",
      "level": "Beginner",
      "price": 99.99,
      "duration": 40,
      "instructor": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "thumbnail": "https://example.com/thumbnail.jpg",
      "rating": {
        "average": 4.7,
        "count": 89
      },
      "isFeatured": true
    }
  ]
}
```

### Get Course Categories
```http
GET /courses/categories
```

**Response (200):**
```json
{
  "categories": [
    "Programming",
    "Design", 
    "Business",
    "Marketing",
    "Finance"
  ]
}
```

### Add Course Review
```http
POST /courses/:id/review
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent course! Highly recommended."
}
```

### Create Course (Admin Only)
```http
POST /courses
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Advanced React Development",
  "description": "Master React with hooks, context, and performance optimization",
  "fullDescription": "Comprehensive React course...",
  "category": "Programming",
  "level": "Advanced",
  "price": 199.99,
  "duration": "8 weeks",
  "totalLessons": 32,
  "requirements": ["Basic React knowledge", "JavaScript ES6+"],
  "whatYouWillLearn": ["Advanced React patterns", "Performance optimization"],
  "tags": ["react", "javascript", "frontend"]
}
```

### Update Course (Admin Only)
```http
PUT /courses/:id
Authorization: Bearer <admin_token>
```

### Delete Course (Admin Only)
```http
DELETE /courses/:id
Authorization: Bearer <admin_token>
```

### Get Featured Courses
```http
GET /courses/featured
```

**Response (200):**
```json
{
  "courses": [
    {
      "id": "64f123abc456def789012345",
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript from basics to advanced concepts",
      "category": "Programming",
      "level": "Beginner",
      "price": 99.99,
      "duration": 40,
      "instructor": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "thumbnail": "https://example.com/thumbnail.jpg",
      "rating": {
        "average": 4.7,
        "count": 89
      },
      "isFeatured": true
    }
  ]
}
```

### Get Course Categories
```http
GET /courses/categories
```

**Response (200):**
```json
{
  "categories": [
    "Programming",
    "Design", 
    "Business",
    "Marketing",
    "Finance"
  ]
}
```

### Add Course Review
```http
POST /courses/:id/review
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent course! Highly recommended."
}
```

---

## 👥 Users API (Admin Only)

### Get All Users
```http
GET /users
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`, `limit`, `search`, `role`, `status`, `sort`, `order`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64f123abc456def789012345",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "student",
        "emailVerified": true,
        "status": "active",
        "enrollmentCount": 3,
        "totalSpent": 299.97,
        "lastLoginAt": "2023-09-15T10:30:00.000Z",
        "createdAt": "2023-09-01T10:00:00.000Z"
      }
    ],
    "pagination": {},
    "summary": {
      "totalUsers": 1250,
      "activeUsers": 1180,
      "studentsCount": 1200,
      "adminsCount": 50
    }
  }
}
```

### Get User by ID
```http
GET /users/:id
Authorization: Bearer <admin_token>
```

### Update User
```http
PUT /users/:id
Authorization: Bearer <admin_token>
```

### Delete User
```http
DELETE /users/:id
Authorization: Bearer <admin_token>
```

### Update User Role
```http
PUT /users/:id/role
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "role": "admin"
}
```

### Update User Status
```http
PUT /users/:id/status
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "isActive": false
}
```

### Get User Dashboard Data
```http
GET /users/dashboard
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "totalUsers": 1250,
  "activeUsers": 1180,
  "newUsersThisMonth": 87,
  "usersByRole": {
    "student": 1200,
    "admin": 50
  },
  "recentSignups": [...]
}
```

### Get User Analytics
```http
GET /users/analytics
Authorization: Bearer <admin_token>
```

### Get User Activity
```http
GET /users/activity
Authorization: Bearer <admin_token>
```

---

## 📝 Enrollments API

### Get User Enrollments
```http
GET /enrollments
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "id": "64f123abc456def789012345",
        "course": {
          "id": "64f123abc456def789012346",
          "title": "JavaScript Fundamentals",
          "thumbnail": "https://example.com/thumbnail.jpg",
          "instructor": "Jane Smith"
        },
        "status": "active",
        "progress": 65,
        "completedLessons": 16,
        "totalLessons": 24,
        "enrolledAt": "2023-09-01T10:00:00.000Z",
        "lastAccessedAt": "2023-09-15T14:30:00.000Z",
        "certificateEligible": false,
        "payment": {
          "amount": 99.99,
          "method": "stripe",
          "status": "completed"
        }
      }
    ],
    "summary": {
      "totalEnrollments": 3,
      "activeEnrollments": 2,
      "completedEnrollments": 1,
      "averageProgress": 72
    }
  }
}
```

### Create Enrollment
```http
POST /enrollments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "64f123abc456def789012346",
  "paymentIntentId": "pi_1234567890abcdef"
}
```

### Update Enrollment Progress
```http
PUT /enrollments/:id/progress
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "completedLessons": ["lesson1", "lesson2"],
  "currentLesson": "lesson3",
  "progressPercentage": 75,
  "timeSpent": 3600
}
```

### Complete Enrollment
```http
PUT /enrollments/:id/complete
Authorization: Bearer <token>
```

### Generate Certificate
```http
POST /enrollments/:id/certificate
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "certificateUrl": "https://example.com/certificates/cert_12345.pdf",
    "certificateId": "CERT_2023_JS_001",
    "issuedAt": "2023-09-15T10:30:00.000Z"
  }
}
```

### Get Enrollment Statistics
```http
GET /enrollments/stats
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "totalEnrollments": 1250,
  "activeEnrollments": 980,
  "completedEnrollments": 270,
  "averageProgress": 68,
  "enrollmentsByMonth": [
    {"month": "2023-08", "count": 45},
    {"month": "2023-09", "count": 67}
  ]
}
```

---

## 💳 Payments API

### Create Payment Intent
```http
POST /payments/create-payment-intent
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "64f123abc456def789012346",
  "paymentMethod": "stripe"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890abcdef_secret_xyz",
    "paymentIntentId": "pi_1234567890abcdef",
    "amount": 9999,
    "currency": "usd",
    "course": {
      "id": "64f123abc456def789012346",
      "title": "JavaScript Fundamentals",
      "price": 99.99
    }
  }
}
```

### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "paymentIntentId": "pi_1234567890abcdef",
  "courseId": "64f123abc456def789012346"
}
```

### Get Payment History
```http
GET /payments
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`, `limit`, `status`, `method`, `dateFrom`, `dateTo`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "64f123abc456def789012345",
        "course": {
          "id": "64f123abc456def789012346",
          "title": "JavaScript Fundamentals"
        },
        "amount": 99.99,
        "currency": "USD",
        "method": "stripe",
        "status": "completed",
        "paymentIntentId": "pi_1234567890abcdef",
        "receiptUrl": "https://stripe.com/receipt/xyz",
        "paidAt": "2023-09-01T10:00:00.000Z",
        "refunded": false
      }
    ],
    "summary": {
      "totalAmount": 299.97,
      "totalPayments": 3,
      "successfulPayments": 3,
      "refundedPayments": 0
    }
  }
}
```

### SSLCommerz Payment Gateway

#### Initialize SSLCommerz Payment
```http
POST /payments/sslcommerz/init
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "64f123abc456def789012346",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+8801234567890",
    "address": "Dhaka, Bangladesh"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    "sessionkey": "123456789abcdef",
    "transactionId": "TXN123456789"
  }
}
```

#### SSLCommerz Success Callback
```http
POST /payments/sslcommerz/success
```

#### SSLCommerz Failure Callback  
```http
POST /payments/sslcommerz/fail
```

#### SSLCommerz Cancel Callback
```http
POST /payments/sslcommerz/cancel
```

#### SSLCommerz Instant Payment Notification (IPN)
```http
POST /payments/sslcommerz/ipn
```

#### Validate SSLCommerz Payment
```http
POST /payments/sslcommerz/validate
Authorization: Bearer <token>
```

#### Process SSLCommerz Refund
```http
POST /payments/sslcommerz/refund
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "paymentId": "64f123abc456def789012345",
  "amount": 99.99,
  "reason": "Course cancelled"
}
```

### Validate SSLCommerz Payment
```http
POST /payments/sslcommerz/validate
```

### Process SSLCommerz Refund
```http
POST /payments/sslcommerz/refund
Authorization: Bearer <admin_token>
```

---

## 🔧 System API

### Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2023-09-15T10:30:00.000Z",
  "uptime": 86400,
  "environment": "production",
  "version": "1.0.0",
  "database": "connected",
  "memory": {
    "rss": 123456789,
    "heapTotal": 87654321,
    "heapUsed": 65432109,
    "external": 12345678
  }
}
```

### System Metrics
```http
GET /metrics
```

**Response (200):**
```json
{
  "timestamp": "2023-09-15T10:30:00.000Z",
  "uptime": 86400,
  "memory": {
    "rss": 123456789,
    "heapTotal": 87654321,
    "heapUsed": 65432109
  },
  "cpu": {
    "user": 123456,
    "system": 78910
  },
  "database": {
    "state": 1,
    "host": "cluster0.mongodb.net",
    "name": "students_enrollment"
  },
  "environment": "production"
}
```

---

## 📊 Error Handling

### Error Response Format

All API errors follow this consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ],
    "timestamp": "2023-09-15T10:30:00.000Z",
    "path": "/api/auth/register",
    "requestId": "req_1234567890abcdef"
  }
}
```

### HTTP Status Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists |
| `422` | Unprocessable Entity | Validation error |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid credentials |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `PAYMENT_ERROR` | Payment processing failed |
| `EMAIL_ERROR` | Email sending failed |
| `RATE_LIMIT_ERROR` | Too many requests |

---

## �� Rate Limiting

### Current Implementation
- **General API**: 100 requests per 15 minutes per IP
- **All endpoints**: Same rate limit applied uniformly

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1694776200
```

### Note
Specific rate limits for authentication endpoints (login attempts, password reset) are not currently implemented but are planned for future releases.

---

## 📝 Request/Response Examples

### Complete Enrollment Flow

1. **Browse Courses**
```http
GET /courses?category=programming&level=beginner
```

2. **Get Course Details**
```http
GET /courses/64f123abc456def789012346
```

3. **Create Payment Intent**
```http
POST /payments/create-payment-intent
{
  "courseId": "64f123abc456def789012346",
  "paymentMethod": "stripe"
}
```

4. **Confirm Payment & Enroll**
```http
POST /payments/confirm
{
  "paymentIntentId": "pi_1234567890abcdef",
  "courseId": "64f123abc456def789012346"
}
```

5. **Access Enrolled Course**
```http
GET /enrollments
```

---

## 🔒 Authentication Examples

### Using cURL

```bash
# Login
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Use token in subsequent requests
curl -X GET https://api.example.com/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Using JavaScript (Axios)

```javascript
// Login and store token
const login = async (email, password) => {
  const response = await axios.post('/api/auth/login', { email, password });
  const { token } = response.data.data;
  localStorage.setItem('token', token);
  return token;
};

// Set default authorization header
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

// Make authenticated requests
const getCourses = async () => {
  const response = await axios.get('/api/courses');
  return response.data.data.courses;
};
```

---

## 📚 Additional Resources

- [Postman Collection](https://documenter.getpostman.com/view/your-collection)
- [OpenAPI Specification](api-spec.yaml)
- [SDK Documentation](SDK.md)
- [Webhook Documentation](WEBHOOKS.md) 