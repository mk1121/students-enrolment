require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./server/models/User');
const Course = require('./server/models/Course');
const Enrollment = require('./server/models/Enrollment');
const Payment = require('./server/models/Payment');

// Sample data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'admin',
    phone: '+1234567890',
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'student',
    phone: '+1234567891',
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    password: 'password123',
    role: 'student',
    phone: '+1234567892',
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    password: 'password123',
    role: 'student',
    phone: '+1234567893',
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    password: 'password123',
    role: 'student',
    phone: '+1234567894',
    isEmailVerified: true,
    isActive: true,
  },
];

const sampleCourses = [
  {
    title: 'Complete Web Development Bootcamp',
    description:
      'Learn web development from scratch with HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and become a full-stack developer.',
    shortDescription: 'Master web development with hands-on projects',
    category: 'Programming',
    level: 'Beginner',
    duration: 40,
    price: 99.99,
    originalPrice: 199.99,
    discount: 50,
    currency: 'USD',
    thumbnail:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
    images: [
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    syllabus: [
      {
        title: 'Introduction to Web Development',
        description: 'Overview of web technologies and development tools',
        duration: 60,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['Slides', 'Code Examples'],
      },
      {
        title: 'HTML Fundamentals',
        description: 'Learn HTML structure and semantic elements',
        duration: 90,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['HTML Cheat Sheet', 'Practice Exercises'],
      },
      {
        title: 'CSS Styling',
        description: 'Master CSS for beautiful web design',
        duration: 120,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['CSS Reference', 'Design Templates'],
      },
    ],
    requirements: [
      'Basic computer skills',
      'No programming experience required',
      'Willingness to learn',
    ],
    learningOutcomes: [
      'Build responsive websites',
      'Create dynamic web applications',
      'Deploy projects to the web',
      'Understand modern web development practices',
    ],
    tags: ['web development', 'javascript', 'react', 'node.js', 'mongodb'],
    maxStudents: 100,
    currentStudents: 45,
    rating: {
      average: 4.8,
      count: 127,
    },
    status: 'published',
    isFeatured: true,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    enrollmentDeadline: new Date('2024-11-30'),
    certificate: true,
    isActive: true,
  },
  {
    title: 'Advanced JavaScript Masterclass',
    description:
      'Deep dive into advanced JavaScript concepts including ES6+, async programming, design patterns, and performance optimization.',
    shortDescription: 'Master advanced JavaScript concepts and patterns',
    category: 'Programming',
    level: 'Advanced',
    duration: 25,
    price: 149.99,
    originalPrice: 199.99,
    discount: 25,
    currency: 'USD',
    thumbnail:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
    images: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    syllabus: [
      {
        title: 'ES6+ Features',
        description: 'Modern JavaScript syntax and features',
        duration: 120,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['ES6 Cheat Sheet', 'Code Examples'],
      },
      {
        title: 'Async Programming',
        description: 'Promises, async/await, and event loops',
        duration: 150,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['Async Patterns Guide', 'Practice Problems'],
      },
    ],
    requirements: [
      'Intermediate JavaScript knowledge',
      'Understanding of basic programming concepts',
      'Experience with web development',
    ],
    learningOutcomes: [
      'Master ES6+ features',
      'Understand async programming patterns',
      'Apply design patterns in JavaScript',
      'Optimize JavaScript performance',
    ],
    tags: ['javascript', 'es6', 'async', 'design patterns', 'performance'],
    maxStudents: 50,
    currentStudents: 28,
    rating: {
      average: 4.9,
      count: 89,
    },
    status: 'published',
    isFeatured: true,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-11-30'),
    enrollmentDeadline: new Date('2024-10-31'),
    certificate: true,
    isActive: true,
  },
  {
    title: 'UI/UX Design Fundamentals',
    description:
      'Learn the principles of user interface and user experience design. Create beautiful, functional, and user-friendly digital products.',
    shortDescription: 'Master UI/UX design principles and tools',
    category: 'Design',
    level: 'Beginner',
    duration: 30,
    price: 79.99,
    originalPrice: 129.99,
    discount: 38,
    currency: 'USD',
    thumbnail:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    images: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    syllabus: [
      {
        title: 'Design Principles',
        description: 'Core principles of good design',
        duration: 90,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['Design Principles Guide', 'Examples'],
      },
      {
        title: 'User Research',
        description: 'Understanding user needs and behaviors',
        duration: 120,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['Research Methods', 'Templates'],
      },
    ],
    requirements: [
      'Creative mindset',
      'Basic computer skills',
      'Interest in design',
    ],
    learningOutcomes: [
      'Apply design principles effectively',
      'Conduct user research',
      'Create wireframes and prototypes',
      'Design user-friendly interfaces',
    ],
    tags: ['ui design', 'ux design', 'figma', 'prototyping', 'user research'],
    maxStudents: 75,
    currentStudents: 32,
    rating: {
      average: 4.7,
      count: 156,
    },
    status: 'published',
    isFeatured: false,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-12-31'),
    enrollmentDeadline: new Date('2024-11-30'),
    certificate: true,
    isActive: true,
  },
  {
    title: 'Digital Marketing Mastery',
    description:
      'Comprehensive digital marketing course covering SEO, social media, email marketing, PPC, and analytics.',
    shortDescription: 'Master digital marketing strategies and tools',
    category: 'Marketing',
    level: 'Intermediate',
    duration: 35,
    price: 129.99,
    originalPrice: 179.99,
    discount: 28,
    currency: 'USD',
    thumbnail:
      'https://images.unsplash.com/photo-1557838923-2985c318be48?w=400',
    images: [
      'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    syllabus: [
      {
        title: 'SEO Fundamentals',
        description: 'Search engine optimization basics',
        duration: 120,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['SEO Checklist', 'Keyword Research Tools'],
      },
      {
        title: 'Social Media Marketing',
        description: 'Strategies for social media success',
        duration: 150,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['Content Calendar', 'Analytics Guide'],
      },
    ],
    requirements: [
      'Basic understanding of business',
      'Familiarity with social media',
      'Willingness to learn new tools',
    ],
    learningOutcomes: [
      'Implement effective SEO strategies',
      'Create engaging social media campaigns',
      'Analyze marketing performance',
      'Develop comprehensive marketing plans',
    ],
    tags: [
      'digital marketing',
      'seo',
      'social media',
      'email marketing',
      'analytics',
    ],
    maxStudents: 60,
    currentStudents: 41,
    rating: {
      average: 4.6,
      count: 203,
    },
    status: 'published',
    isFeatured: true,
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-12-31'),
    enrollmentDeadline: new Date('2024-11-30'),
    certificate: true,
    isActive: true,
  },
  {
    title: 'Python for Data Science',
    description:
      'Learn Python programming for data analysis, machine learning, and scientific computing with real-world projects.',
    shortDescription: 'Master Python for data science and analysis',
    category: 'Programming',
    level: 'Intermediate',
    duration: 45,
    price: 159.99,
    originalPrice: 229.99,
    discount: 30,
    currency: 'USD',
    thumbnail:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
    images: [
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    syllabus: [
      {
        title: 'Python Basics',
        description: 'Python fundamentals for data science',
        duration: 180,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['Python Cheat Sheet', 'Jupyter Notebooks'],
      },
      {
        title: 'Data Analysis with Pandas',
        description: 'Data manipulation and analysis',
        duration: 240,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        materials: ['Pandas Guide', 'Sample Datasets'],
      },
    ],
    requirements: [
      'Basic programming knowledge',
      'Understanding of mathematics',
      'Interest in data analysis',
    ],
    learningOutcomes: [
      'Write Python code for data analysis',
      'Use pandas for data manipulation',
      'Create data visualizations',
      'Apply machine learning algorithms',
    ],
    tags: [
      'python',
      'data science',
      'pandas',
      'numpy',
      'matplotlib',
      'machine learning',
    ],
    maxStudents: 40,
    currentStudents: 23,
    rating: {
      average: 4.9,
      count: 78,
    },
    status: 'published',
    isFeatured: false,
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-11-30'),
    enrollmentDeadline: new Date('2024-10-31'),
    certificate: true,
    isActive: true,
  },
];

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/students-enrollment',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Payment.deleteMany({});

    // Remove users with the same emails before seeding
    await User.deleteMany({
      email: {
        $in: [
          'john.doe@example.com',
          'jane.smith@example.com',
          'mike.johnson@example.com',
        ],
      },
    });

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.create(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get admin user for instructor role
    const adminUser = createdUsers.find(user => user.role === 'admin');
    const students = createdUsers.filter(user => user.role === 'student');

    // Create courses with instructor
    console.log('📚 Creating courses...');
    const coursesWithInstructor = sampleCourses.map(course => ({
      ...course,
      instructor: adminUser._id,
    }));
    const createdCourses = await Course.create(coursesWithInstructor);
    console.log(`✅ Created ${createdCourses.length} courses`);

    // Create enrollments
    console.log('📝 Creating enrollments...');
    const enrollments = [];
    const payments = [];

    for (let i = 0; i < createdCourses.length; i++) {
      const course = createdCourses[i];
      const student = students[i % students.length];

      // Create enrollment
      const enrollment = new Enrollment({
        student: student._id,
        course: course._id,
        status: ['active', 'completed', 'pending'][
          Math.floor(Math.random() * 3)
        ],
        enrollmentDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random date within last 30 days
        startDate: new Date(),
        progress: Math.floor(Math.random() * 100),
        grade: [
          'A+',
          'A',
          'A-',
          'B+',
          'B',
          'B-',
          'C+',
          'C',
          'C-',
          'D+',
          'D',
          'F',
          'Incomplete',
        ][Math.floor(Math.random() * 13)],
        score: Math.floor(Math.random() * 100),
        payment: {
          amount: course.price,
          currency: course.currency,
          paymentMethod: ['stripe', 'sslcommerz', 'cash'][
            Math.floor(Math.random() * 3)
          ],
          paymentStatus: ['completed', 'pending'][
            Math.floor(Math.random() * 2)
          ],
          paymentDate: new Date(),
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
        isActive: true,
      });

      enrollments.push(enrollment);

      // Create payment
      const payment = new Payment({
        user: student._id,
        enrollment: enrollment._id,
        course: course._id,
        amount: course.price,
        currency: course.currency,
        paymentMethod: enrollment.payment.paymentMethod,
        status:
          enrollment.payment.paymentStatus === 'completed'
            ? 'completed'
            : 'pending',
        transactionId: enrollment.payment.transactionId,
        description: `Payment for ${course.title}`,
        metadata: {
          customerEmail: student.email,
          customerName: `${student.firstName} ${student.lastName}`,
          courseTitle: course.title,
          courseId: course._id.toString(),
          enrollmentId: enrollment._id.toString(),
        },
        billingDetails: {
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.phone,
        },
        netAmount: course.price,
        isActive: true,
      });

      payments.push(payment);
    }

    // Save enrollments and payments
    const createdEnrollments = await Enrollment.create(enrollments);
    console.log(`✅ Created ${createdEnrollments.length} enrollments`);

    const createdPayments = await Payment.create(payments);
    console.log(`✅ Created ${createdPayments.length} payments`);

    // Add some reviews to courses
    console.log('⭐ Adding reviews...');
    for (const course of createdCourses) {
      const courseReviews = [];
      for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
        const student = students[Math.floor(Math.random() * students.length)];
        courseReviews.push({
          user: student._id,
          rating: Math.floor(Math.random() * 5) + 1,
          comment: [
            'Great course! Very comprehensive and well-structured.',
            'Excellent content and clear explanations.',
            'Really enjoyed this course. Highly recommended!',
            'Good course with practical examples.',
            'Very informative and engaging material.',
          ][Math.floor(Math.random() * 5)],
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ),
        });
      }
      course.reviews = courseReviews;
      await course.save();
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   📚 Courses: ${createdCourses.length}`);
    console.log(`   📝 Enrollments: ${createdEnrollments.length}`);
    console.log(`   💳 Payments: ${createdPayments.length}`);

    // Display sample data
    console.log('\n🔍 Sample Data:');
    console.log('   Admin User:', adminUser.email);
    console.log(
      '   Featured Course:',
      createdCourses.find(c => c.isFeatured)?.title
    );
    console.log(
      '   Active Enrollments:',
      createdEnrollments.filter(e => e.status === 'active').length
    );
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed function
seedDatabase();
