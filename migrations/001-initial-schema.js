const mongoose = require('mongoose');

module.exports = {
  up: async function() {
    console.log('  📋 Creating initial database schema...');

    // Create collections and indexes for all models
    const db = mongoose.connection.db;

    // Helper function to create index safely
    const createIndexSafely = async (collection, indexSpec, options = {}) => {
      try {
        await db.collection(collection).createIndex(indexSpec, options);
        return true;
      } catch (error) {
        if (error.code === 86) { // IndexKeySpecsConflict
          console.log(`  ⚠️  Index already exists for ${collection}: ${JSON.stringify(indexSpec)}`);
          return false;
        }
        throw error;
      }
    };

    // Create indexes for User collection
    await createIndexSafely('users', { email: 1 }, { unique: true });
    await createIndexSafely('users', { role: 1 });
    console.log('  ✅ User indexes created');

    // Create indexes for Course collection
    await createIndexSafely('courses', { title: 'text', description: 'text', tags: 'text' });
    await createIndexSafely('courses', { category: 1 });
    await createIndexSafely('courses', { level: 1 });
    await createIndexSafely('courses', { status: 1 });
    await createIndexSafely('courses', { isFeatured: 1 });
    await createIndexSafely('courses', { price: 1 });
    await createIndexSafely('courses', { instructor: 1 });
    console.log('  ✅ Course indexes created');

    // Create indexes for Enrollment collection
    await createIndexSafely('enrollments', { student: 1, course: 1 }, { unique: true });
    await createIndexSafely('enrollments', { student: 1 });
    await createIndexSafely('enrollments', { course: 1 });
    await createIndexSafely('enrollments', { status: 1 });
    await createIndexSafely('enrollments', { enrollmentDate: 1 });
    await createIndexSafely('enrollments', { 'payment.paymentStatus': 1 });
    console.log('  ✅ Enrollment indexes created');

    // Create indexes for Payment collection
    await createIndexSafely('payments', { user: 1 });
    await createIndexSafely('payments', { enrollment: 1 });
    await createIndexSafely('payments', { course: 1 });
    await createIndexSafely('payments', { status: 1 });
    await createIndexSafely('payments', { createdAt: 1 });
    await createIndexSafely('payments', { transactionId: 1 });
    await createIndexSafely('payments', { stripePaymentIntentId: 1 });
    await createIndexSafely('payments', { stripeChargeId: 1 });
    console.log('  ✅ Payment indexes created');

    console.log('  🎉 Initial schema setup completed');
  },

  down: async function() {
    console.log('  🔄 Rolling back initial schema...');
    
    const db = mongoose.connection.db;

    // Drop all indexes
    try {
      await db.collection('users').dropIndexes();
      await db.collection('courses').dropIndexes();
      await db.collection('enrollments').dropIndexes();
      await db.collection('payments').dropIndexes();
      console.log('  ✅ All indexes dropped');
    } catch (error) {
      console.log('  ⚠️  Some indexes may not exist:', error.message);
    }
  }
}; 