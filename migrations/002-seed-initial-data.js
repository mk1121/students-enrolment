const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../server/models/User');
const Course = require('../server/models/Course');
const Enrollment = require('../server/models/Enrollment');
const Payment = require('../server/models/Payment');

module.exports = {
  up: async function() {
    console.log('  🌱 Seeding initial data...');

    // Sample users
    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'admin',
        phone: '+1234567890',
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        role: 'student',
        phone: '+1234567891',
        isEmailVerified: true,
        isActive: true
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        password: 'password123',
        role: 'student',
        phone: '+1234567892',
        isEmailVerified: true,
        isActive: true
      }
    ];

    // Create users
    console.log('  👥 Creating users...');
    const createdUsers = await User.create(sampleUsers);
    console.log(`  ✅ Created ${createdUsers.length} users`);

    // Get admin user for instructor role
    const adminUser = createdUsers.find(user => user.role === 'admin');
    const students = createdUsers.filter(user => user.role === 'student');

    // Sample courses
    const sampleCourses = [
      {
        title: 'Complete Web Development Bootcamp',
        description: 'Learn web development from scratch with HTML, CSS, JavaScript, React, Node.js, and MongoDB.',
        shortDescription: 'Master web development with hands-on projects',
        category: 'Programming',
        level: 'Beginner',
        duration: 40,
        price: 99.99,
        originalPrice: 199.99,
        discount: 50,
        currency: 'USD',
        thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
        images: [
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'
        ],
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        syllabus: [
          {
            title: 'Introduction to Web Development',
            description: 'Overview of web technologies and development tools',
            duration: 60,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            materials: ['Slides', 'Code Examples']
          }
        ],
        requirements: [
          'Basic computer skills',
          'No programming experience required'
        ],
        learningOutcomes: [
          'Build responsive websites',
          'Create dynamic web applications'
        ],
        tags: ['web development', 'javascript', 'react'],
        maxStudents: 100,
        currentStudents: 45,
        rating: {
          average: 4.8,
          count: 127
        },
        status: 'published',
        isFeatured: true,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        enrollmentDeadline: new Date('2024-11-30'),
        certificate: true,
        instructor: adminUser._id,
        isActive: true
      },
      {
        title: 'Advanced JavaScript Masterclass',
        description: 'Deep dive into advanced JavaScript concepts including ES6+, async programming, and design patterns.',
        shortDescription: 'Master advanced JavaScript concepts and patterns',
        category: 'Programming',
        level: 'Advanced',
        duration: 25,
        price: 149.99,
        originalPrice: 199.99,
        discount: 25,
        currency: 'USD',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
        images: [
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'
        ],
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        syllabus: [
          {
            title: 'ES6+ Features',
            description: 'Modern JavaScript syntax and features',
            duration: 120,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            materials: ['ES6 Cheat Sheet', 'Code Examples']
          }
        ],
        requirements: [
          'Intermediate JavaScript knowledge',
          'Understanding of basic programming concepts'
        ],
        learningOutcomes: [
          'Master ES6+ features',
          'Understand async programming patterns'
        ],
        tags: ['javascript', 'es6', 'async', 'design patterns'],
        maxStudents: 50,
        currentStudents: 28,
        rating: {
          average: 4.9,
          count: 89
        },
        status: 'published',
        isFeatured: true,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-11-30'),
        enrollmentDeadline: new Date('2024-10-31'),
        certificate: true,
        instructor: adminUser._id,
        isActive: true
      }
    ];

    // Create courses
    console.log('  📚 Creating courses...');
    const createdCourses = await Course.create(sampleCourses);
    console.log(`  ✅ Created ${createdCourses.length} courses`);

    // Create enrollments and payments
    console.log('  📝 Creating enrollments and payments...');
    const enrollments = [];
    const payments = [];

    for (let i = 0; i < createdCourses.length; i++) {
      const course = createdCourses[i];
      const student = students[i % students.length];
      
      // Create enrollment
      const enrollment = new Enrollment({
        student: student._id,
        course: course._id,
        status: 'active',
        enrollmentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        startDate: new Date(),
        progress: Math.floor(Math.random() * 100),
        grade: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'Incomplete'][Math.floor(Math.random() * 13)],
        score: Math.floor(Math.random() * 100),
        payment: {
          amount: course.price,
          currency: course.currency,
          paymentMethod: ['stripe', 'paypal', 'bank_transfer', 'cash'][Math.floor(Math.random() * 4)],
          paymentStatus: 'completed',
          paymentDate: new Date(),
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        isActive: true
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
        status: 'completed',
        transactionId: enrollment.payment.transactionId,
        description: `Payment for ${course.title}`,
        metadata: {
          customerEmail: student.email,
          customerName: `${student.firstName} ${student.lastName}`,
          courseTitle: course.title,
          courseId: course._id.toString(),
          enrollmentId: enrollment._id.toString()
        },
        billingDetails: {
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.phone
        },
        netAmount: course.price,
        isActive: true
      });

      payments.push(payment);
    }

    // Save enrollments and payments
    const createdEnrollments = await Enrollment.create(enrollments);
    console.log(`  ✅ Created ${createdEnrollments.length} enrollments`);

    const createdPayments = await Payment.create(payments);
    console.log(`  ✅ Created ${createdPayments.length} payments`);

    // Add reviews to courses
    console.log('  ⭐ Adding reviews...');
    for (const course of createdCourses) {
      const courseReviews = [];
      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const student = students[Math.floor(Math.random() * students.length)];
        courseReviews.push({
          user: student._id,
          rating: Math.floor(Math.random() * 5) + 1,
          comment: [
            'Great course! Very comprehensive and well-structured.',
            'Excellent content and clear explanations.',
            'Really enjoyed this course. Highly recommended!'
          ][Math.floor(Math.random() * 3)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
      course.reviews = courseReviews;
      await course.save();
    }

    console.log('  🎉 Initial data seeding completed');
  },

  down: async function() {
    console.log('  🔄 Rolling back initial data...');
    
    // Remove all seeded data
    await User.deleteMany({ email: { $in: ['john.doe@example.com', 'jane.smith@example.com', 'mike.johnson@example.com'] } });
    await Course.deleteMany({ title: { $in: ['Complete Web Development Bootcamp', 'Advanced JavaScript Masterclass'] } });
    await Enrollment.deleteMany({});
    await Payment.deleteMany({});
    
    console.log('  ✅ Initial data removed');
  }
}; 