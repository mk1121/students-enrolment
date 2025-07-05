const mongoose = require('mongoose');

module.exports = {
  up: async function() {
    console.log('  📚 Cleaning up and adding materials field to courses...');

    const db = mongoose.connection.db;
    
    // First, completely remove any existing materials field to clean up corrupted data
    await db.collection('courses').updateMany(
      {},
      { $unset: { materials: "" } }
    );
    console.log('  🧹 Cleaned up existing materials field');

    // Get all courses using raw MongoDB driver
    const courses = await db.collection('courses').find({}).toArray();
    
    // Update each course with new materials using raw MongoDB operations
    for (const course of courses) {
      const materials = [
        {
          title: `${course.title} Handbook`,
          type: 'pdf',
          url: `https://example.com/${course._id}/handbook.pdf`,
          description: `Complete guide for ${course.title}`
        },
        {
          title: `${course.title} Resources`,
          type: 'link',
          url: `https://github.com/example/${course._id}-resources`,
          description: `Additional resources and materials for ${course.title}`
        }
      ];
      
      // Use raw MongoDB update to avoid Mongoose validation during migration
      await db.collection('courses').updateOne(
        { _id: course._id },
        { $set: { materials: materials } }
      );
    }
    console.log(`  ✅ Added materials to ${courses.length} courses`);
  },

  down: async function() {
    console.log('  🔄 Removing materials field from courses...');
    const db = mongoose.connection.db;
    // Use the raw driver to unset the materials field for all courses
    await db.collection('courses').updateMany({}, { $unset: { materials: "" } });
    console.log('  ✅ Materials field removed from all courses');
  }
};