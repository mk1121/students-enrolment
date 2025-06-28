# Database Migrations

This directory contains database migrations for the Students Enrollment System. Migrations allow you to version control your database schema changes and apply them in a consistent manner across different environments.

## Overview

Migrations are a way to manage database schema changes over time. Each migration file represents a specific change to the database structure or data, allowing you to:
- Version control your database changes
- Apply changes consistently across environments
- Roll back problematic changes
- Share schema updates with team members

## Migration Files

### Current Migrations

| Version | File | Description |
|---------|------|-------------|
| 001 | `001-initial-schema.js` | Creates initial database indexes and schema structure |
| 002 | `002-seed-initial-data.js` | Seeds the database with initial sample data |
| 003 | `003-add-course-materials.js` | Adds materials field to existing courses |

### Migration Status

Each migration tracks its execution state:
- ✅ **Applied**: Migration has been successfully executed
- ⏳ **Pending**: Migration is ready to be applied
- ❌ **Failed**: Migration encountered an error during execution

## Usage

### Running Migrations

```bash
# Run all pending migrations
npm run migrate:run
node migrate.js run

# Check migration status first
npm run migrate:status
node migrate.js status
```

### Rolling Back Migrations

```bash
# Rollback the last migration
npm run migrate:rollback
node migrate.js rollback

# Rollback the last 3 migrations
npm run migrate:rollback 3
node migrate.js rollback 3
```

### Resetting Database

```bash
# Rollback all migrations and run them again
npm run migrate:reset
node migrate.js reset
```

### Checking Migration Status

```bash
# View current migration status
npm run migrate:status
node migrate.js status
```

Example output:
```
🚀 Students Enrollment System - Migration Tool
==================================================
📊 Migration Status:

✅ 001-initial-schema.js        (Applied on: 2024-01-15T10:30:00.000Z)
✅ 002-seed-initial-data.js     (Applied on: 2024-01-15T10:30:15.000Z)
⏳ 003-add-course-materials.js  (Pending)

Total: 3 migrations (2 applied, 1 pending)
```

## Creating New Migrations

### Naming Convention

Follow this naming pattern for new migration files:

```
{version}-{description}.js
```

Examples:
- `004-add-user-preferences.js`
- `005-create-notifications-table.js`
- `006-update-course-pricing.js`

### Migration File Structure

```javascript
const mongoose = require('mongoose');

module.exports = {
  up: async function() {
    console.log('  📋 Applying migration: Add user preferences...');
    
    // Your migration logic here
    const User = require('../server/models/User');
    
    await User.updateMany({}, {
      $set: {
        preferences: {
          emailNotifications: true,
          theme: 'light',
          language: 'en'
        }
      }
    });
    
    console.log('  ✅ Migration completed successfully');
  },

  down: async function() {
    console.log('  🔄 Rolling back migration: Remove user preferences...');
    
    // Your rollback logic here
    const User = require('../server/models/User');
    
    await User.updateMany({}, {
      $unset: { preferences: 1 }
    });
    
    console.log('  ✅ Rollback completed successfully');
  }
};
```

## Migration Best Practices

### 1. Design Guidelines

- **Single Responsibility**: Each migration should focus on one specific change
- **Idempotent Operations**: Migrations should be safe to run multiple times
- **Backward Compatibility**: Consider impact on existing data
- **Performance**: Be mindful of large data operations

### 2. Code Standards

```javascript
// ✅ Good: Clear logging and error handling
module.exports = {
  up: async function() {
    console.log('  📋 Adding course categories...');
    
    try {
      const Course = require('../server/models/Course');
      const result = await Course.updateMany(
        { category: { $exists: false } },
        { $set: { category: 'General' } }
      );
      
      console.log(`  ✅ Updated ${result.modifiedCount} courses`);
    } catch (error) {
      console.error('  ❌ Migration failed:', error.message);
      throw error;
    }
  },
  
  down: async function() {
    console.log('  🔄 Removing course categories...');
    
    const Course = require('../server/models/Course');
    await Course.updateMany({}, { $unset: { category: 1 } });
    
    console.log('  ✅ Rollback completed');
  }
};
```

### 3. Data Safety

- **Backup Critical Data**: Always backup before destructive operations
- **Test Migrations**: Run in development environment first
- **Validate Results**: Check data integrity after migration
- **Rollback Plan**: Ensure down() function properly reverses changes

## Migration Examples

### Adding New Fields

```javascript
// 004-add-user-social-links.js
const User = require('../server/models/User');

module.exports = {
  up: async function() {
    console.log('  📋 Adding social links to user profiles...');
    
    const result = await User.updateMany({}, {
      $set: {
        socialLinks: {
          linkedin: '',
          github: '',
          website: ''
        }
      }
    });
    
    console.log(`  ✅ Updated ${result.modifiedCount} users`);
  },

  down: async function() {
    console.log('  🔄 Removing social links from user profiles...');
    
    await User.updateMany({}, {
      $unset: { socialLinks: 1 }
    });
    
    console.log('  ✅ Rollback completed');
  }
};
```

### Creating Indexes

```javascript
// 005-add-search-indexes.js
const mongoose = require('mongoose');

module.exports = {
  up: async function() {
    console.log('  📋 Creating search indexes...');
    
    const db = mongoose.connection.db;
    
    // Text search index for courses
    await db.collection('courses').createIndex(
      { title: 'text', description: 'text', tags: 'text' },
      { name: 'course_search_index' }
    );
    
    // Compound index for enrollments
    await db.collection('enrollments').createIndex(
      { student: 1, course: 1 },
      { unique: true, name: 'student_course_unique' }
    );
    
    console.log('  ✅ Search indexes created');
  },

  down: async function() {
    console.log('  🔄 Dropping search indexes...');
    
    const db = mongoose.connection.db;
    
    await db.collection('courses').dropIndex('course_search_index');
    await db.collection('enrollments').dropIndex('student_course_unique');
    
    console.log('  ✅ Indexes dropped');
  }
};
```

### Data Transformation

```javascript
// 006-normalize-course-pricing.js
const Course = require('../server/models/Course');

module.exports = {
  up: async function() {
    console.log('  📋 Normalizing course pricing...');
    
    // Convert string prices to numbers
    const courses = await Course.find({ price: { $type: 'string' } });
    
    for (const course of courses) {
      const numericPrice = parseFloat(course.price);
      if (!isNaN(numericPrice)) {
        course.price = numericPrice;
        await course.save();
      }
    }
    
    console.log(`  ✅ Normalized ${courses.length} course prices`);
  },

  down: async function() {
    console.log('  🔄 Reverting course pricing to strings...');
    
    // Convert numeric prices back to strings
    const courses = await Course.find({ price: { $type: 'number' } });
    
    for (const course of courses) {
      course.price = course.price.toString();
      await course.save();
    }
    
    console.log(`  ✅ Reverted ${courses.length} course prices`);
  }
};
```

## Migration Tracking

The migration system automatically tracks execution status in a `migrations` collection:

```javascript
{
  _id: ObjectId("..."),
  version: "001",
  name: "initial-schema",
  filename: "001-initial-schema.js",
  appliedAt: ISODate("2024-01-15T10:30:00.000Z"),
  executionTime: 1250 // milliseconds
}
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Migration fails | Syntax error or runtime error | Check logs, fix code, re-run |
| Rollback fails | Missing or incorrect down() function | Implement proper rollback logic |
| Connection timeout | Large data operations | Add batch processing or increase timeout |
| Duplicate execution | Migration tracking error | Check migration collection status |

### Error Handling

```javascript
// Example of robust error handling
module.exports = {
  up: async function() {
    console.log('  📋 Starting complex migration...');
    
    try {
      // Validate prerequisites
      const User = require('../server/models/User');
      const userCount = await User.countDocuments();
      
      if (userCount === 0) {
        console.log('  ⚠️  No users found, skipping migration');
        return;
      }
      
      // Perform migration in batches
      const batchSize = 100;
      let processed = 0;
      
      while (processed < userCount) {
        const users = await User.find()
          .skip(processed)
          .limit(batchSize);
          
        // Process batch
        for (const user of users) {
          // ... migration logic
        }
        
        processed += users.length;
        console.log(`  📊 Processed ${processed}/${userCount} users`);
      }
      
      console.log('  ✅ Migration completed successfully');
      
    } catch (error) {
      console.error('  ❌ Migration failed:', error.message);
      console.error('  📋 Stack trace:', error.stack);
      throw error; // Re-throw to mark migration as failed
    }
  }
};
```

### Recovery Procedures

1. **Failed Migration Recovery**:
   ```bash
   # Check status
   node migrate.js status
   
   # Fix the migration file
   # Re-run migrations
   node migrate.js run
   ```

2. **Manual State Correction**:
   ```javascript
   // If you need to manually mark a migration as completed
   db.migrations.insertOne({
     version: "003",
     name: "add-course-materials",
     filename: "003-add-course-materials.js",
     appliedAt: new Date(),
     executionTime: 0
   });
   ```

3. **Emergency Rollback**:
   ```bash
   # Rollback problematic migration
   node migrate.js rollback
   
   # Or reset entire database
   node migrate.js reset
   ```

## Environment Configuration

Ensure proper database configuration in your `.env` file:

```env
# Required for migrations
MONGODB_URI=mongodb://localhost:27017/students-enrollment

# Optional: Migration-specific settings
MIGRATION_TIMEOUT=30000
MIGRATION_BATCH_SIZE=100
```

## Integration with Deployment

### Development Workflow

1. Create migration file
2. Test in development environment
3. Commit to version control
4. Deploy to staging
5. Run migrations in staging
6. Deploy to production
7. Run migrations in production

### Production Deployment

```bash
# 1. Backup database
mongodump --uri="$MONGODB_URI" --out backup-$(date +%Y%m%d-%H%M%S)

# 2. Run migrations
npm run migrate:run

# 3. Verify application
npm run health-check
```

## Advanced Usage

### Custom Migration Runner

```javascript
// custom-migration.js
const MigrationRunner = require('./migrations/migration-runner');

async function customMigration() {
  const runner = new MigrationRunner();
  
  try {
    await runner.connect();
    runner.loadMigrations();
    
    // Run specific migration
    await runner.runMigration('003-add-course-materials.js');
    
  } finally {
    await runner.disconnect();
  }
}
```

### Conditional Migrations

```javascript
// Migration that runs only in specific environments
module.exports = {
  up: async function() {
    if (process.env.NODE_ENV === 'production') {
      console.log('  ⚠️  Skipping in production environment');
      return;
    }
    
    console.log('  📋 Running development-only migration...');
    // ... migration logic
  }
};
``` 