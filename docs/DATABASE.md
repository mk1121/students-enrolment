# 🗄️ Database Documentation
## Students Enrollment System - Database Design & Schema

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [📊 Data Models](#-data-models)
- [🔗 Relationships](#-relationships)
- [📈 Indexing Strategy](#-indexing-strategy)
- [🔒 Security](#-security)
- [📝 Migrations](#-migrations)
- [🧪 Seeding](#-seeding)

---

## 🎯 Overview

The Students Enrollment System uses **MongoDB** as its primary database, implemented with **Mongoose ODM** for Node.js. The database is designed to handle student enrollment workflows, course management, payment processing, and user authentication efficiently.

### Database Configuration

```javascript
// Connection Configuration
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
});
```

### Environment-Specific Databases

| Environment | Database Name | URI Pattern |
|-------------|---------------|-------------|
| Development | `students_enrollment_dev` | `mongodb://localhost:27017/students_enrollment_dev` |
| Testing | `students_enrollment_test` | `mongodb://localhost:27017/students_enrollment_test` |
| Staging | `students_enrollment_staging` | `mongodb+srv://cluster.mongodb.net/students_enrollment_staging` |
| Production | `students_enrollment_prod` | `mongodb+srv://cluster.mongodb.net/students_enrollment_prod` |

---

## 🏗️ Architecture

### Database Design Principles

1. **Document-Oriented**: Leverage MongoDB's document structure for complex nested data
2. **Denormalization**: Strategic denormalization for read performance
3. **Referencing**: Use ObjectId references for large, frequently changing data
4. **Embedding**: Embed related data that changes together
5. **Indexing**: Comprehensive indexing strategy for query optimization

### Data Flow Architecture

```mermaid
graph TD
    A[User Registration] --> B[User Document]
    B --> C[Authentication]
    C --> D[Course Browsing]
    D --> E[Payment Processing]
    E --> F[Enrollment Creation]
    F --> G[Course Access]
    G --> H[Progress Tracking]
    
    I[Admin] --> J[Course Management]
    J --> K[Course Document]
    K --> D
    
    E --> L[Payment Document]
    L --> M[Transaction Log]
```

---

## 📊 Data Models

### 👤 User Model

**File:** `server/models/User.js`

```javascript
const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include in queries by default
  },
  
  // User Role & Status
  role: {
    type: String,
    enum: ['student', 'admin', 'instructor'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Verification & Security
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Profile Information
  profile: {
    phone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    avatar: String, // URL to profile image
    website: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String
    }
  },
  
  // Activity Tracking
  lastLoginAt: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    marketingEmails: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

**Indexes:**
```javascript
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ createdAt: -1 });
```

**Virtual Fields:**
```javascript
// Full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Enrollment count (populated dynamically)
userSchema.virtual('enrollmentCount', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'user',
  count: true
});
```

### 📚 Course Model

**File:** `server/models/Course.js`

```javascript
const courseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  fullDescription: {
    type: String,
    maxlength: [5000, 'Full description cannot exceed 5000 characters']
  },
  
  // Course Classification
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'Other']
  },
  subcategory: String,
  level: {
    type: String,
    required: [true, 'Level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Pricing & Duration
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: Number, // For discount calculations
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'BDT']
  },
  duration: {
    weeks: Number,
    hours: Number,
    description: String // e.g., "6 weeks", "40 hours"
  },
  
  // Course Structure
  totalLessons: {
    type: Number,
    default: 0
  },
  curriculum: [{
    module: {
      type: String,
      required: true
    },
    description: String,
    duration: String,
    lessons: [{
      title: String,
      description: String,
      duration: String, // e.g., "15:30"
      type: {
        type: String,
        enum: ['video', 'text', 'quiz', 'assignment'],
        default: 'video'
      },
      isFree: {
        type: Boolean,
        default: false
      }
    }]
  }],
  
  // Course Requirements & Outcomes
  requirements: [String],
  whatYouWillLearn: [String],
  targetAudience: [String],
  
  // Instructor Information
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  
  // Media & Resources
  thumbnail: String, // URL to course thumbnail
  previewVideo: String, // URL to preview video
  materials: [{
    type: {
      type: String,
      enum: ['video', 'document', 'code', 'quiz', 'assignment'],
      required: true
    },
    title: String,
    description: String,
    url: String,
    duration: String,
    fileSize: Number,
    downloadable: {
      type: Boolean,
      default: false
    }
  }],
  
  // Course Status & Visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'under-review'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  publishedAt: Date,
  
  // Analytics & Statistics
  enrollmentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // SEO & Marketing
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

**Indexes:**
```javascript
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ status: 1, isPublic: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ 'rating.average': -1 });
```

### 📝 Enrollment Model

**File:** `server/models/Enrollment.js`

```javascript
const enrollmentSchema = new mongoose.Schema({
  // Core References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  
  // Enrollment Status
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  startDate: Date,
  completionDate: Date,
  expirationDate: Date,
  
  // Progress Tracking
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      lessonId: String,
      completedAt: Date,
      timeSpent: Number // in seconds
    }],
    totalTimeSpent: {
      type: Number,
      default: 0 // in seconds
    },
    lastAccessedAt: Date,
    currentLesson: String
  },
  
  // Assessment & Certification
  assessments: [{
    assessmentId: String,
    score: Number,
    maxScore: Number,
    attempts: Number,
    completedAt: Date,
    passed: Boolean
  }],
  finalScore: Number,
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: String,
  certificateUrl: String,
  
  // Payment Information
  payment: {
    amount: Number,
    currency: String,
    method: String, // 'stripe', 'sslcommerz', etc.
    transactionId: String,
    paymentIntentId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  
  // Course Access
  accessLevel: {
    type: String,
    enum: ['full', 'preview', 'limited'],
    default: 'full'
  },
  downloadedMaterials: [String], // Array of material IDs
  
  // Notes & Reviews
  notes: [{
    lessonId: String,
    content: String,
    timestamp: Number, // Video timestamp
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    reviewedAt: Date,
    helpful: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

**Indexes:**
```javascript
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ user: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ 'payment.status': 1 });
```

### 💳 Payment Model

**File:** `server/models/Payment.js`

```javascript
const paymentSchema = new mongoose.Schema({
  // Core References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment'
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD'
  },
  originalAmount: Number, // Before discounts
  discountAmount: Number,
  discountCode: String,
  taxAmount: Number,
  
  // Payment Method & Provider
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['stripe', 'sslcommerz', 'cash']
  },
  provider: {
    paymentIntentId: String, // Stripe
    chargeId: String,
    sessionId: String, // SSLCommerz
    transactionId: String,
    merchantTransactionId: String
  },
  
  // Payment Status & Timing
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  
  // Refund Information
  refunds: [{
    amount: Number,
    reason: String,
    refundId: String, // Provider refund ID
    refundedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending'
    }
  }],
  
  // Customer Information
  customer: {
    name: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  
  // Receipt & Documentation
  receiptUrl: String,
  receiptNumber: String,
  invoiceUrl: String,
  description: String,
  
  // Metadata & Tracking
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: String, // 'web', 'mobile', 'api'
    campaignId: String,
    affiliateId: String
  },
  
  // Error Information
  errorDetails: {
    code: String,
    message: String,
    timestamp: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

**Indexes:**
```javascript
paymentSchema.index({ user: 1 });
paymentSchema.index({ course: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ 'provider.paymentIntentId': 1 });
paymentSchema.index({ 'provider.transactionId': 1 });
```

---

## 🔗 Relationships

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Enrollment : "enrolls in"
    User ||--o{ Payment : "makes"
    Course ||--o{ Enrollment : "has"
    Course ||--o{ Payment : "receives payment for"
    Course }o--|| User : "taught by (instructor)"
    Enrollment ||--|| Payment : "paid through"
    
    User {
        ObjectId _id PK
        string name
        string email UK
        string role
        object profile
        date createdAt
    }
    
    Course {
        ObjectId _id PK
        string title
        string category
        number price
        ObjectId instructor FK
        array curriculum
        date createdAt
    }
    
    Enrollment {
        ObjectId _id PK
        ObjectId user FK
        ObjectId course FK
        string status
        object progress
        date enrollmentDate
    }
    
    Payment {
        ObjectId _id PK
        ObjectId user FK
        ObjectId course FK
        ObjectId enrollment FK
        number amount
        string status
        string method
        date paidAt
    }
```

### Relationship Details

#### One-to-Many Relationships

1. **User → Enrollments**
   - One user can have multiple enrollments
   - Accessed via virtual population or direct query

2. **User → Payments**
   - One user can make multiple payments
   - Used for payment history and analytics

3. **Course → Enrollments**
   - One course can have multiple enrollments
   - Used for enrollment count and student list

4. **Course → Payments**
   - One course can receive multiple payments
   - Used for revenue analytics

#### One-to-One Relationships

1. **Enrollment ↔ Payment**
   - Each enrollment is associated with one payment
   - Payment references the enrollment for transaction tracking

#### Many-to-One Relationships

1. **Course → User (Instructor)**
   - Many courses can be taught by one instructor
   - Instructor information is populated when needed

---

## 📈 Indexing Strategy

### Performance Optimization

Our indexing strategy focuses on:
1. **Query Performance**: Optimize frequent queries
2. **Uniqueness**: Ensure data integrity
3. **Sorting**: Support pagination and ordering
4. **Text Search**: Enable full-text search capabilities

### Index Types

#### Single Field Indexes
```javascript
// Unique indexes for data integrity
{ email: 1 } // User email uniqueness
{ slug: 1 }  // Course slug uniqueness

// Status and filtering indexes
{ status: 1 } // User/Course/Enrollment status
{ role: 1 }   // User role filtering
```

#### Compound Indexes
```javascript
// User-Course enrollment uniqueness
{ user: 1, course: 1 } // Enrollment model

// Category and level filtering for courses
{ category: 1, level: 1 }

// Status and visibility for published courses
{ status: 1, isPublic: 1 }
```

#### Text Indexes
```javascript
// Full-text search for courses
{
  title: 'text',
  description: 'text',
  tags: 'text'
}
```

#### TTL Indexes
```javascript
// Auto-expire verification tokens
{ emailVerificationExpires: 1 } // 24 hours
{ passwordResetExpires: 1 }     // 1 hour
```

### Index Monitoring

```javascript
// Check index usage
db.users.getIndexes()
db.courses.explain("executionStats").find({ category: "Programming" })

// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })
```

---

## 🔒 Security

### Data Security Measures

#### 1. Password Security
```javascript
// Password hashing before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

#### 2. Sensitive Data Protection
```javascript
// Exclude sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.emailVerificationToken;
  return user;
};
```

#### 3. Input Validation
```javascript
// Mongoose validation
email: {
  type: String,
  required: [true, 'Email is required'],
  unique: true,
  lowercase: true,
  match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
}

// Express-validator middleware
const { body } = require('express-validator');

const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 1, max: 100 })
];
```

#### 4. Data Sanitization
```javascript
// Remove dangerous characters
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// XSS protection
const xss = require('xss');
const sanitizedContent = xss(userInput);
```

### Database Access Control

#### Connection Security
```javascript
// Secure connection with authentication
const MONGODB_URI = `mongodb+srv://${username}:${password}@${host}/${database}?retryWrites=true&w=majority&ssl=true`;

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  authSource: 'admin',
  ssl: true,
  sslValidate: true
};
```

#### Role-Based Access
```javascript
// Database user roles
{
  "role": "readWrite",
  "db": "students_enrollment_prod"
}

// Application-level role checking
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

---

## 📝 Migrations

### Migration System

Our migration system ensures database schema consistency across environments.

#### Migration Structure
```javascript
// migrations/001-initial-schema.js
module.exports = {
  async up() {
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('courses').createIndex({ title: 'text', description: 'text' });
    
    // Seed initial data
    await db.collection('users').insertOne({
      name: 'System Admin',
      email: 'admin@system.com',
      role: 'admin',
      createdAt: new Date()
    });
  },
  
  async down() {
    // Rollback changes
    await db.collection('users').dropIndex({ email: 1 });
    await db.collection('courses').dropIndex({ title: 'text', description: 'text' });
  }
};
```

#### Running Migrations
```bash
# Run all pending migrations
bun run migrate

# Check migration status
bun run migrate:status

# Rollback last migration
bun run migrate:rollback
```

---

## 🧪 Seeding

### Development Data Seeding

#### Sample Data Structure
```javascript
// seed.js
const seedData = {
  users: [
    {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      emailVerified: true
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'instructor',
      emailVerified: true
    }
  ],
  courses: [
    {
      title: 'JavaScript Fundamentals',
      category: 'Programming',
      level: 'Beginner',
      price: 99.99,
      instructor: 'jane@example.com' // Will be resolved to ObjectId
    }
  ]
};
```

#### Seeding Commands
```bash
# Simple seeding (essential data only)
node seed-simple.js

# Full seeding (comprehensive test data)
node seed.js

# Clear and reseed
node seed.js --reset
```

---

## 📊 Database Monitoring

### Performance Metrics

#### Query Performance
```javascript
// Enable profiling for slow queries
db.setProfilingLevel(2, { slowms: 100 });

// View slow queries
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty();

// Index usage statistics
db.runCommand({ collStats: "courses" });
```

#### Connection Monitoring
```javascript
// Monitor connection pool
const mongoose = require('mongoose');

mongoose.connection.on('connected', () => {
  console.log('Database connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('Database connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Database disconnected');
});
```

### Health Checks

```javascript
// Database health check endpoint
app.get('/api/health/database', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (dbState === 1) {
      // Test with a simple query
      await mongoose.connection.db.admin().ping();
      res.json({ status: 'healthy', state: states[dbState] });
    } else {
      res.status(503).json({ status: 'unhealthy', state: states[dbState] });
    }
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## 🔧 Database Maintenance

### Backup Strategy

```bash
# Daily automated backup
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/students_enrollment_prod" --out=/backups/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/students_enrollment_prod" /backups/20231201/students_enrollment_prod
```

### Data Cleanup

```javascript
// Clean up expired tokens
const cleanupExpiredTokens = async () => {
  await User.updateMany(
    { emailVerificationExpires: { $lt: new Date() } },
    { $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } }
  );
  
  await User.updateMany(
    { passwordResetExpires: { $lt: new Date() } },
    { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } }
  );
};

// Run cleanup daily
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);
```

---

## 📚 Additional Resources

- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Database Migration Guide](MIGRATIONS.md)
- [Seeding Documentation](SEEDING.md) 