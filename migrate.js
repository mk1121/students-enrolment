#!/usr/bin/env node

const path = require('path');
const MigrationRunner = require('./migrations/migration-runner');

async function main() {
  const command = process.argv[2] || 'run';
  const count = parseInt(process.argv[3]) || 1;

  console.log('🚀 Students Enrollment System - Migration Tool');
  console.log('='.repeat(50));

  const runner = new MigrationRunner();

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
      case 'reset':
        console.log('🔄 Resetting database...');
        await runner.rollbackMigrations(999); // Rollback all
        await runner.runMigrations(); // Run all again
        break;
      default:
        console.log(
          'Usage: node migrate.js [run|rollback|status|reset] [count]'
        );
        console.log('');
        console.log('Commands:');
        console.log('  run      - Run pending migrations');
        console.log('  rollback - Rollback last N migrations (default: 1)');
        console.log('  status   - Show migration status');
        console.log('  reset    - Rollback all and run all migrations');
        console.log('');
        console.log('Examples:');
        console.log('  node migrate.js run');
        console.log('  node migrate.js rollback 2');
        console.log('  node migrate.js status');
        console.log('  node migrate.js reset');
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
