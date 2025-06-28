# Database Seeding Documentation

This document explains the database seeding system for the Students Enrollment System, which provides sample data for development, testing, and demonstration purposes.

## Overview

The seeding system populates the database with realistic sample data including:
- Users (students, instructors, admins)
- Courses with detailed information
- Enrollments and progress tracking
- Payments and transactions
- Course reviews and ratings

## Seeding Scripts

### Available Scripts

| Script | Purpose | Data Volume | Use Case |
|--------|---------|-------------|----------|
| `seed.js` | Full comprehensive seeding | ~500+ records | Development, Demo |
| `seed-simple.js` | Basic essential data | ~50 records | Testing, Quick Setup |

### Bun Scripts

```bash
# Run full seeding
bun run seed

# Run simple seeding
bun run seed:simple

# Clear database and reseed
bun run seed:fresh
```

### Direct Execution

```bash
# Full seeding
node seed.js

# Simple seeding  
node seed-simple.js
```

## Seed Data Structure

### 1. Users (`seed.js`)

**Admin Users**:
- 1 Super Admin
- 2 Admin accounts

**Instructors**:
- 5 Instructor accounts with profiles
- Specializations in different fields

**Students**:
- 20+ Student accounts
- Varied enrollment patterns
- Different profile completeness levels

```javascript
// Example user generation
const users = [
  {
    firstName: 'John',
    lastName: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    isEmailVerified: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.instructor@example.com',
    role: 'instructor',
    bio: 'Full-stack developer with 8 years experience...'
  }
  // ... more users
];
```

### 2. Courses

**Categories Covered**:
- Programming (JavaScript, Python, React, etc.)
- Design (UI/UX, Graphic Design)
- Business (Marketing, Management)
- Data Science & Analytics

**Course Features**:
- Detailed descriptions and syllabi
- Realistic pricing ($50 - $500)
- Multiple difficulty levels
- Instructor assignments
- Course materials and resources

```javascript
// Example course structure
const courses = [
  {
    title: 'Complete Web Development Bootcamp',
    description: 'Learn full-stack web development...',
    instructor: instructorId,
    category: 'Programming',
    level: 'Beginner',
    price: 299,
    duration: 120,
    syllabus: [
      {
        title: 'HTML & CSS Fundamentals',
        description: 'Learn the basics...',
        duration: 180
      }
      // ... more modules
    ]
  }
  // ... more courses
];
```

### 3. Enrollments

**Enrollment Patterns**:
- Students enrolled in multiple courses
- Various completion statuses
- Progress tracking data
- Realistic enrollment dates

### 4. Payments

**Payment Data**:
- Stripe transaction simulations
- Various payment statuses
- Refund scenarios
- Payment history tracking

### 5. Reviews & Ratings

**Review System**:
- Course ratings (1-5 stars)
- Detailed review comments
- Varied review dates
- Rating distribution

## Simple Seeding (`seed-simple.js`)

The simple seeding script provides minimal essential data:

### Data Included

- **1 Admin User**: For system management
- **2 Instructor Users**: To create courses
- **5 Student Users**: For enrollment testing
- **5 Courses**: Covering different categories
- **Basic Enrollments**: Students enrolled in courses
- **Sample Payments**: Basic payment records

### Quick Setup

```bash
# For quick development setup
bun run seed:simple

# Or directly
node seed-simple.js
```

## Seeding Process Flow

### 1. Database Preparation

```javascript
// Clear existing data
await User.deleteMany({});
await Course.deleteMany({});
await Enrollment.deleteMany({});
await Payment.deleteMany({});

console.log('🧹 Database cleared');
```

### 2. User Creation

```javascript
// Create users with hashed passwords
const users = await User.insertMany(userData.map(user => ({
  ...user,
  password: 'hashedPassword123' // Will be hashed by pre-save middleware
})));

console.log(`👥 Created ${users.length} users`);
```

### 3. Course Creation

```javascript
// Create courses with instructor assignments
const courses = await Course.insertMany(courseData);
console.log(`📚 Created ${courses.length} courses`);
```

### 4. Relationship Building

```javascript
// Create enrollments and payments
const enrollments = await Enrollment.insertMany(enrollmentData);
const payments = await Payment.insertMany(paymentData);

console.log(`📝 Created ${enrollments.length} enrollments`);
console.log(`💳 Created ${payments.length} payments`);
```

## Environment Configuration

### Required Environment Variables

```env
# Database connection
MONGODB_URI=mongodb://localhost:27017/students-enrollment

# JWT for token generation (if needed)
JWT_SECRET=your-jwt-secret-key

# Stripe (for payment simulation)
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# Email configuration (optional for seeding)
EMAIL_USER=your-email@gmail.com
```

### Development vs Production

```javascript
// Environment-aware seeding
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('⚠️  Skipping seeding in production environment');
  process.exit(0);
}
```

## Customizing Seed Data

### Adding New Users

```javascript
// In seed.js or seed-simple.js
const customUsers = [
  {
    firstName: 'Custom',
    lastName: 'User',
    email: 'custom@example.com',
    role: 'student',
    isEmailVerified: true,
    profile: {
      bio: 'Custom user for specific testing...',
      dateOfBirth: new Date('1990-01-01'),
      phone: '+1234567890'
    }
  }
];
```

### Adding Custom Courses

```javascript
const customCourses = [
  {
    title: 'Advanced React Patterns',
    description: 'Learn advanced React patterns and best practices...',
    category: 'Programming',
    level: 'Advanced',
    price: 399,
    duration: 80,
    requirements: ['Basic React knowledge', 'JavaScript ES6+'],
    learningOutcomes: [
      'Master React Hooks',
      'Implement performance optimizations',
      'Build scalable React applications'
    ]
  }
];
```

## Data Validation

### Pre-Seeding Checks

```javascript
// Validate environment
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

// Check database connectivity
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Database connected');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}
```

### Post-Seeding Verification

```javascript
// Verify seeded data
const userCount = await User.countDocuments();
const courseCount = await Course.countDocuments();
const enrollmentCount = await Enrollment.countDocuments();

console.log('\n📊 Seeding Summary:');
console.log(`👥 Users: ${userCount}`);
console.log(`📚 Courses: ${courseCount}`);
console.log(`📝 Enrollments: ${enrollmentCount}`);

// Validate relationships
const coursesWithInstructors = await Course.countDocuments({
  instructor: { $exists: true }
});

if (coursesWithInstructors !== courseCount) {
  console.warn('⚠️  Some courses missing instructor assignments');
}
```

## Seeding Best Practices

### 1. Data Consistency

- Use consistent naming conventions
- Maintain referential integrity
- Validate required fields

### 2. Realistic Data

```javascript
// Use realistic data patterns
const userEmails = [
  'john.doe@example.com',      // Standard format
  'sarah.j@university.edu',    // Academic email
  'mike.instructor@tech.com'   // Professional email
];

// Realistic pricing
const coursePrices = [49, 99, 149, 199, 299, 399, 499];
```

### 3. Performance Optimization

```javascript
// Batch inserts for better performance
const BATCH_SIZE = 100;

for (let i = 0; i < userData.length; i += BATCH_SIZE) {
  const batch = userData.slice(i, i + BATCH_SIZE);
  await User.insertMany(batch);
  console.log(`📊 Processed ${Math.min(i + BATCH_SIZE, userData.length)}/${userData.length} users`);
}
```

### 4. Error Handling

```javascript
async function seedUsers() {
  try {
    const users = await User.insertMany(userData);
    console.log(`✅ Successfully created ${users.length} users`);
    return users;
  } catch (error) {
    console.error('❌ Failed to seed users:', error.message);
    
    // Handle specific errors
    if (error.code === 11000) {
      console.error('   Duplicate key error - some users may already exist');
    }
    
    throw error;
  }
}
```

## Integration with Development Workflow

### 1. Development Setup

```bash
# Fresh development setup
bun run db:reset      # Clear database
bun run migrate:run   # Run migrations
bun run seed         # Seed with sample data
bun run dev          # Start development server
```

### 2. Testing Setup

```bash
# Before running tests
bun run seed:simple   # Quick minimal data
bun test             # Run test suite
```

### 3. Demo Preparation

```bash
# Prepare for demonstration
bun run seed          # Full rich dataset
bun run migrate:run   # Ensure schema is current
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Duplicate key error | Email conflicts | Clear database first or use unique emails |
| Validation errors | Invalid data format | Check data against model schemas |
| Connection timeout | Large datasets | Increase MongoDB timeout or use batching |
| Memory issues | Too much data | Process in smaller batches |

### Debug Mode

```javascript
// Enable debug logging
const DEBUG = process.env.DEBUG_SEEDING === 'true';

if (DEBUG) {
  console.log('🐛 Debug mode enabled');
  console.log('📊 Sample user data:', userData[0]);
  console.log('📚 Sample course data:', courseData[0]);
}
```

### Manual Cleanup

```javascript
// Emergency cleanup script
async function cleanup() {
  await User.deleteMany({ email: { $regex: /@example\.com$/ } });
  await Course.deleteMany({ title: { $regex: /^Sample|Test|Demo/ } });
  console.log('🧹 Cleanup completed');
}
```

## Advanced Seeding Scenarios

### 1. Conditional Seeding

```javascript
// Seed only if database is empty
const userCount = await User.countDocuments();

if (userCount > 0) {
  console.log('📊 Database already has users, skipping seeding');
  console.log('💡 Use --force flag to override');
  
  if (!process.argv.includes('--force')) {
    process.exit(0);
  }
}
```

### 2. Incremental Seeding

```javascript
// Add new data without clearing existing
async function incrementalSeed() {
  console.log('📈 Running incremental seeding...');
  
  // Add new courses for existing instructors
  const instructors = await User.find({ role: 'instructor' });
  
  for (const instructor of instructors) {
    if (await Course.countDocuments({ instructor: instructor._id }) < 3) {
      // Add more courses for this instructor
      await createCoursesForInstructor(instructor);
    }
  }
}
```

### 3. Custom Seeding Scripts

```javascript
// Custom seeding for specific scenarios
async function seedForTesting() {
  // Create specific test scenarios
  await createUserWithManyEnrollments();
  await createCourseWithManyReviews();
  await createPaymentFailureScenarios();
}

async function seedForDemo() {
  // Create impressive demo data
  await createPopularCoursesWithHighRatings();
  await createActiveStudentCommunity();
  await createRecentSuccessStories();
}
```

## Monitoring and Logging

### Seeding Progress

```javascript
const ora = require('ora'); // Loading spinner

const spinner = ora('Seeding database...').start();

try {
  spinner.text = 'Creating users...';
  await seedUsers();
  
  spinner.text = 'Creating courses...';
  await seedCourses();
  
  spinner.text = 'Creating enrollments...';
  await seedEnrollments();
  
  spinner.succeed('Database seeded successfully!');
} catch (error) {
  spinner.fail('Seeding failed: ' + error.message);
}
```

### Execution Metrics

```javascript
const startTime = Date.now();

// ... seeding process ...

const endTime = Date.now();
const duration = (endTime - startTime) / 1000;

console.log(`\n⏱️  Seeding completed in ${duration.toFixed(2)} seconds`);
console.log(`📊 Average: ${(totalRecords / duration).toFixed(0)} records/second`);
``` 