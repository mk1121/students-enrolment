# Database Migrations Guide

This guide provides comprehensive information about the database migration system for the Students Enrollment System.

## Quick Start

```bash
# Check current migration status
bun run migrate:status

# Run all pending migrations
bun run migrate:run

# Rollback last migration if needed
bun run migrate:rollback
```

## Migration System Overview

### Purpose
Database migrations provide a version-controlled way to:
- 📋 Evolve database schema over time
- 🔄 Apply changes consistently across environments
- ⏪ Rollback problematic changes
- 👥 Share database changes with team members
- 🚀 Automate deployment processes

### How It Works
1. **Migration Files**: JavaScript files containing `up` and `down` functions
2. **Version Tracking**: MongoDB collection tracks applied migrations
3. **Sequential Execution**: Migrations run in numerical order
4. **Rollback Support**: Each migration can be reversed

## Current Migration Timeline

| Version | Migration | Description | Status |
|---------|-----------|-------------|---------|
| 001 | `initial-schema.js` | Database indexes and initial structure | ✅ Applied |
| 002 | `seed-initial-data.js` | Sample users, courses, and data | ✅ Applied |
| 003 | `add-course-materials.js` | Course materials field and data | ⏳ Pending |

## Migration Commands

### Basic Operations

```bash
# View help
node migrate.js

# Check migration status
node migrate.js status
bun run migrate:status

# Run pending migrations
node migrate.js run
bun run migrate:run

# Rollback migrations
node migrate.js rollback [count]
bun run migrate:rollback [count]

# Reset all migrations
node migrate.js reset
bun run migrate:reset
```

### Advanced Usage

```bash
# Rollback specific number of migrations
node migrate.js rollback 3

# Force run migrations (bypass safety checks)
node migrate.js run --force

# Dry run (show what would be executed)
node migrate.js run --dry-run
```

## Migration File Structure

### Template
```javascript
const mongoose = require('mongoose');

module.exports = {
  up: async function() {
    console.log('  📋 Applying migration: [Description]...');
    
    try {
      // Migration logic here
      const Model = require('../server/models/ModelName');
      
      // Example: Add new field
      await Model.updateMany({}, {
        $set: { newField: 'defaultValue' }
      });
      
      console.log('  ✅ Migration completed successfully');
    } catch (error) {
      console.error('  ❌ Migration failed:', error.message);
      throw error;
    }
  },

  down: async function() {
    console.log('  🔄 Rolling back migration: [Description]...');
    
    try {
      // Rollback logic here
      const Model = require('../server/models/ModelName');
      
      // Example: Remove field
      await Model.updateMany({}, {
        $unset: { newField: 1 }
      });
      
      console.log('  ✅ Rollback completed successfully');
    } catch (error) {
      console.error('  ❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
```

### Naming Convention
- Format: `{version}-{description}.js`
- Version: 3-digit zero-padded number (001, 002, 003, etc.)
- Description: kebab-case description of changes

Examples:
- ✅ `004-add-user-preferences.js`
- ✅ `005-create-notifications-table.js`
- ✅ `006-update-course-pricing-structure.js`
- ❌ `4-add-stuff.js` (poor naming)

## Environment Setup

### Required Environment Variables
```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/students-enrollment

# Optional: Migration-specific settings
MIGRATION_TIMEOUT=30000
MIGRATION_BATCH_SIZE=100
LOG_LEVEL=info
```

### Development vs Production
```javascript
// Environment-aware migrations
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

if (isProd && !process.argv.includes('--force')) {
  console.log('⚠️  Production safety check enabled');
  // Additional validation for production
}
```

## Migration Patterns

### 1. Adding Fields
```javascript
// 004-add-user-social-profiles.js
const User = require('../server/models/User');

module.exports = {
  up: async function() {
    console.log('  📋 Adding social profiles to users...');
    
    const result = await User.updateMany(
      { socialProfiles: { $exists: false } },
      {
        $set: {
          socialProfiles: {
            linkedin: '',
            twitter: '',
            github: '',
            website: ''
          }
        }
      }
    );
    
    console.log(`  ✅ Updated ${result.modifiedCount} users`);
  },

  down: async function() {
    console.log('  🔄 Removing social profiles from users...');
    
    await User.updateMany({}, {
      $unset: { socialProfiles: 1 }
    });
    
    console.log('  ✅ Social profiles removed');
  }
};
```

### 2. Creating Indexes
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
      { 
        name: 'course_search_index',
        weights: { title: 3, description: 2, tags: 1 }
      }
    );
    
    // Compound index for enrollments
    await db.collection('enrollments').createIndex(
      { student: 1, course: 1 },
      { unique: true, name: 'student_course_unique' }
    );
    
    // Performance index for payments
    await db.collection('payments').createIndex(
      { createdAt: -1, status: 1 },
      { name: 'payment_status_date' }
    );
    
    console.log('  ✅ Search indexes created');
  },

  down: async function() {
    console.log('  🔄 Dropping search indexes...');
    
    const db = mongoose.connection.db;
    
    try {
      await db.collection('courses').dropIndex('course_search_index');
      await db.collection('enrollments').dropIndex('student_course_unique');
      await db.collection('payments').dropIndex('payment_status_date');
    } catch (error) {
      console.log('  ⚠️  Some indexes may not exist:', error.message);
    }
    
    console.log('  ✅ Indexes dropped');
  }
};
```

### 3. Data Transformation
```javascript
// 006-normalize-user-names.js
const User = require('../server/models/User');

module.exports = {
  up: async function() {
    console.log('  📋 Normalizing user names...');
    
    const users = await User.find({});
    let updated = 0;
    
    for (const user of users) {
      let hasChanges = false;
      
      // Trim whitespace
      if (user.firstName !== user.firstName.trim()) {
        user.firstName = user.firstName.trim();
        hasChanges = true;
      }
      
      if (user.lastName !== user.lastName.trim()) {
        user.lastName = user.lastName.trim();
        hasChanges = true;
      }
      
      // Capitalize first letter
      if (user.firstName[0] !== user.firstName[0].toUpperCase()) {
        user.firstName = user.firstName.charAt(0).toUpperCase() + 
                        user.firstName.slice(1).toLowerCase();
        hasChanges = true;
      }
      
      if (hasChanges) {
        await user.save();
        updated++;
      }
    }
    
    console.log(`  ✅ Normalized ${updated} user names`);
  },

  down: async function() {
    console.log('  🔄 Cannot reverse name normalization');
    console.log('  ⚠️  This migration is not reversible');
  }
};
```

### 4. Schema Changes
```javascript
// 007-restructure-course-pricing.js
const Course = require('../server/models/Course');

module.exports = {
  up: async function() {
    console.log('  📋 Restructuring course pricing...');
    
    const courses = await Course.find({});
    
    for (const course of courses) {
      // Old structure: { price: 299 }
      // New structure: { pricing: { amount: 299, currency: 'USD', discount: 0 } }
      
      if (typeof course.price === 'number' && !course.pricing) {
        course.pricing = {
          amount: course.price,
          currency: course.currency || 'USD',
          discount: course.discount || 0,
          originalAmount: course.originalPrice || course.price
        };
        
        // Remove old fields
        course.price = undefined;
        course.currency = undefined;
        course.discount = undefined;
        course.originalPrice = undefined;
        
        await course.save();
      }
    }
    
    console.log(`  ✅ Restructured ${courses.length} course pricing`);
  },

  down: async function() {
    console.log('  🔄 Reverting course pricing structure...');
    
    const courses = await Course.find({ pricing: { $exists: true } });
    
    for (const course of courses) {
      if (course.pricing) {
        course.price = course.pricing.amount;
        course.currency = course.pricing.currency;
        course.discount = course.pricing.discount;
        course.originalPrice = course.pricing.originalAmount;
        
        course.pricing = undefined;
        await course.save();
      }
    }
    
    console.log(`  ✅ Reverted ${courses.length} course pricing`);
  }
};
```

## Production Migration Strategy

### Pre-Migration Checklist
- [ ] 🔍 Test migration in development
- [ ] 🔍 Test migration in staging
- [ ] 💾 Create database backup
- [ ] 📋 Review migration for performance impact
- [ ] ⏰ Schedule maintenance window if needed
- [ ] 👥 Notify team of deployment
- [ ] 📝 Prepare rollback plan

### Deployment Process
```bash
# 1. Backup database
mongodump --uri="$MONGODB_URI" --out "backup-$(date +%Y%m%d-%H%M%S)"

# 2. Run migration
bun run migrate:run

# 3. Verify application health
bun run health-check

# 4. Monitor logs
tail -f logs/application.log
```

### Safety Measures
```javascript
// Migration with safety checks
module.exports = {
  up: async function() {
    // Environment check
    if (process.env.NODE_ENV === 'production') {
      console.log('  ⚠️  Running in production - extra caution enabled');
      
      // Require explicit confirmation for destructive operations
      if (!process.env.MIGRATION_CONFIRMED) {
        throw new Error('Set MIGRATION_CONFIRMED=true for production migrations');
      }
    }
    
    // Data validation
    const User = require('../server/models/User');
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('  ⚠️  No users found - skipping migration');
      return;
    }
    
    console.log(`  📊 Processing ${userCount} users...`);
    
    // Batch processing for large datasets
    const batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE) || 100;
    let processed = 0;
    
    while (processed < userCount) {
      const users = await User.find()
        .skip(processed)
        .limit(batchSize);
      
      for (const user of users) {
        // Process user
        await processUser(user);
      }
      
      processed += users.length;
      console.log(`  📊 Processed ${processed}/${userCount} users`);
      
      // Small delay to avoid overwhelming database
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
};
```

## Troubleshooting

### Common Issues

#### 1. Migration Fails Midway
```bash
# Check migration status
node migrate.js status

# Look for partial completion
db.migrations.find().sort({ appliedAt: -1 })

# Fix the migration and re-run
node migrate.js run
```

#### 2. Rollback Fails
```javascript
// Robust rollback with error handling
down: async function() {
  console.log('  🔄 Starting rollback...');
  
  try {
    // Attempt normal rollback
    await normalRollback();
  } catch (error) {
    console.log('  ⚠️  Normal rollback failed, attempting manual cleanup...');
    
    // Manual cleanup procedures
    await manualCleanup();
  }
  
  console.log('  ✅ Rollback completed');
}
```

#### 3. Performance Issues
```javascript
// Optimized migration for large datasets
up: async function() {
  const mongoose = require('mongoose');
  
  // Use raw MongoDB operations for better performance
  const db = mongoose.connection.db;
  
  // Bulk operations
  const bulk = db.collection('users').initializeUnorderedBulkOp();
  
  const users = await db.collection('users').find({}).toArray();
  
  users.forEach(user => {
    bulk.find({ _id: user._id }).updateOne({
      $set: { newField: computeNewValue(user) }
    });
  });
  
  const result = await bulk.execute();
  console.log(`  ✅ Updated ${result.modifiedCount} documents`);
}
```

### Debug Mode
```bash
# Enable detailed logging
DEBUG=migration* node migrate.js run

# Log to file
node migrate.js run 2>&1 | tee migration.log
```

### Manual Recovery
```javascript
// Emergency procedures
async function emergencyRollback() {
  const mongoose = require('mongoose');
  
  // Connect to database
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Manual state correction
  await mongoose.connection.db.collection('migrations').deleteOne({
    version: '003'
  });
  
  // Undo changes manually
  await mongoose.connection.db.collection('courses').updateMany(
    {},
    { $unset: { materials: 1 } }
  );
  
  console.log('Emergency rollback completed');
}
```

## Best Practices

### 1. Migration Design
- ✅ Keep migrations small and focused
- ✅ Test thoroughly before production
- ✅ Make migrations idempotent
- ✅ Include proper error handling
- ✅ Add meaningful logging
- ✅ Document breaking changes

### 2. Performance Considerations
- ✅ Use batch processing for large datasets
- ✅ Add indexes before data operations
- ✅ Consider maintenance windows for heavy operations
- ✅ Monitor database performance during migration
- ✅ Use raw MongoDB operations when needed

### 3. Safety Measures
- ✅ Always backup before migration
- ✅ Test rollback procedures
- ✅ Validate data integrity after migration
- ✅ Have emergency procedures ready
- ✅ Monitor application after deployment

### 4. Team Collaboration
- ✅ Document migration purpose and impact
- ✅ Code review all migrations
- ✅ Coordinate with team on timing
- ✅ Communicate breaking changes
- ✅ Share rollback procedures

## Migration Monitoring

### Execution Metrics
```javascript
// Add timing and metrics to migrations
module.exports = {
  up: async function() {
    const startTime = Date.now();
    
    console.log('  📋 Starting migration...');
    
    // Migration logic here
    const result = await performMigration();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`  ✅ Migration completed in ${duration.toFixed(2)}s`);
    console.log(`  📊 Processed ${result.modifiedCount} documents`);
    console.log(`  🚀 Performance: ${(result.modifiedCount / duration).toFixed(0)} docs/sec`);
  }
};
```

### Health Checks
```javascript
// Post-migration validation
async function validateMigration() {
  const User = require('../server/models/User');
  
  // Check data consistency
  const usersWithNewField = await User.countDocuments({
    newField: { $exists: true }
  });
  
  const totalUsers = await User.countDocuments();
  
  if (usersWithNewField !== totalUsers) {
    throw new Error(`Migration incomplete: ${usersWithNewField}/${totalUsers} users updated`);
  }
  
  console.log('  ✅ Migration validation passed');
}
```

## Advanced Topics

### Custom Migration Runner
```javascript
// custom-migration-runner.js
const MigrationRunner = require('./migrations/migration-runner');

class CustomMigrationRunner extends MigrationRunner {
  async runMigration(filename) {
    console.log(`🔧 Custom processing for ${filename}`);
    
    // Add custom logic before/after migration
    await this.preProcessing(filename);
    const result = await super.runMigration(filename);
    await this.postProcessing(filename, result);
    
    return result;
  }
  
  async preProcessing(filename) {
    // Custom pre-processing logic
    await this.createBackup(filename);
    await this.validateEnvironment();
  }
  
  async postProcessing(filename, result) {
    // Custom post-processing logic
    await this.validateMigrationResult(result);
    await this.notifyTeam(filename, result);
  }
}
```

### Parallel Migrations
```javascript
// For independent migrations that can run in parallel
async function runParallelMigrations() {
  const migrations = [
    'update-user-indexes',
    'update-course-indexes',
    'update-payment-indexes'
  ];
  
  await Promise.all(migrations.map(async (migration) => {
    const runner = new MigrationRunner();
    await runner.runSpecificMigration(migration);
  }));
}
``` 