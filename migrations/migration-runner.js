require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Migration schema to track executed migrations
const migrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    required: true
  }
});

const Migration = mongoose.model('Migration', migrationSchema);

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname);
    this.migrations = [];
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/students-enrollment', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }

  loadMigrations() {
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js') && file !== 'migration-runner.js')
      .sort();

    this.migrations = files.map(file => {
      const migration = require(path.join(this.migrationsPath, file));
      return {
        name: file,
        version: parseInt(file.split('-')[0]),
        ...migration
      };
    });

    console.log(`📁 Loaded ${this.migrations.length} migration(s)`);
  }

  async getExecutedMigrations() {
    try {
      return await Migration.find().sort({ version: 1 });
    } catch (error) {
      // If migrations collection doesn't exist, create it
      if (error.name === 'MongoError' && error.code === 26) {
        return [];
      }
      throw error;
    }
  }

  async runMigrations() {
    console.log('🚀 Starting migration process...');

    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));

    const pendingMigrations = this.migrations.filter(m => !executedVersions.has(m.version));

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`\n🔄 Running migration: ${migration.name}`);
        
        if (migration.up) {
          await migration.up();
        }

        // Record migration as executed
        await Migration.create({
          name: migration.name,
          version: migration.version
        });

        console.log(`✅ Migration ${migration.name} completed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
  }

  async rollbackMigrations(count = 1) {
    console.log(`🔄 Rolling back ${count} migration(s)...`);

    const executedMigrations = await this.getExecutedMigrations();
    const migrationsToRollback = executedMigrations.slice(-count);

    for (const executedMigration of migrationsToRollback.reverse()) {
      const migration = this.migrations.find(m => m.version === executedMigration.version);
      
      if (!migration) {
        console.warn(`⚠️  Migration file not found for: ${executedMigration.name}`);
        continue;
      }

      try {
        console.log(`\n🔄 Rolling back migration: ${migration.name}`);
        
        if (migration.down) {
          await migration.down();
        }

        // Remove migration record
        await Migration.deleteOne({ _id: executedMigration._id });

        console.log(`✅ Migration ${migration.name} rolled back successfully`);
      } catch (error) {
        console.error(`❌ Rollback of ${migration.name} failed:`, error);
        throw error;
      }
    }

    console.log('\n🎉 Rollback completed successfully!');
  }

  async showStatus() {
    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));

    console.log('\n📊 Migration Status:');
    console.log('='.repeat(50));

    for (const migration of this.migrations) {
      const isExecuted = executedVersions.has(migration.version);
      const status = isExecuted ? '✅ Executed' : '⏳ Pending';
      const executedAt = isExecuted 
        ? executedMigrations.find(m => m.version === migration.version)?.executedAt
        : null;

      console.log(`${migration.name.padEnd(30)} ${status}`);
      if (executedAt) {
        console.log(`  └─ Executed at: ${executedAt.toLocaleString()}`);
      }
    }

    console.log('='.repeat(50));
  }
}

// CLI interface
async function main() {
  const runner = new MigrationRunner();
  const command = process.argv[2] || 'run';
  const count = parseInt(process.argv[3]) || 1;

  try {
    await runner.connect();
    runner.loadMigrations();

    switch (command) {
      case 'run':
        await runner.runMigrations();
        break;
      case 'rollback':
        await runner.rollbackMigrations(count);
        break;
      case 'status':
        await runner.showStatus();
        break;
      default:
        console.log('Usage: node migration-runner.js [run|rollback|status] [count]');
        console.log('  run      - Run pending migrations');
        console.log('  rollback - Rollback last N migrations (default: 1)');
        console.log('  status   - Show migration status');
    }
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await runner.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationRunner; 