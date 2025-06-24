#!/usr/bin/env node

/**
 * CI Setup Validation Script
 * Tests that the local CI environment is properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    return false;
  }
}

function runCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    log(`✓ ${description}`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description}`, 'red');
    log(`  Error: ${error.message}`, 'yellow');
    return false;
  }
}

function main() {
  log('\n🔍 Validating CI Setup...', 'blue');
  log('========================\n', 'blue');

  let allChecks = true;

  // Check configuration files
  log('📁 Configuration Files:', 'blue');
  allChecks &= checkFile('.github/workflows/ci.yml', 'GitHub Actions workflow');
  allChecks &= checkFile('jest.config.js', 'Jest configuration');
  allChecks &= checkFile('.eslintrc.js', 'ESLint configuration');
  allChecks &= checkFile('.prettierrc', 'Prettier configuration');
  allChecks &= checkFile('.prettierignore', 'Prettier ignore file');
  allChecks &= checkFile('Dockerfile', 'Docker configuration');
  allChecks &= checkFile(
    'docker-compose.test.yml',
    'Docker Compose test config'
  );
  allChecks &= checkFile('.dockerignore', 'Docker ignore file');

  // Check environment files
  log('\n🔧 Environment Files:', 'blue');
  allChecks &= checkFile('.env.test', 'Test environment variables');
  allChecks &= checkFile('.secrets', 'Act secrets file');

  // Check test directory structure
  log('\n🧪 Test Structure:', 'blue');
  allChecks &= checkFile('tests', 'Tests directory');
  allChecks &= checkFile('tests/setup.js', 'Test setup file');
  allChecks &= checkFile('tests/unit', 'Unit tests directory');
  allChecks &= checkFile('tests/integration', 'Integration tests directory');

  // Check package.json scripts
  log('\n📦 Package Scripts:', 'blue');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = [
      'lint',
      'format:check',
      'test:backend',
      'test:coverage',
      'ci:test',
    ];

    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`✓ Script: ${script}`, 'green');
      } else {
        log(`✗ Script: ${script}`, 'red');
        allChecks = false;
      }
    });
  } catch (error) {
    log('✗ Could not read package.json', 'red');
    allChecks = false;
  }

  // Check dependencies
  log('\n📚 Dependencies:', 'blue');
  const requiredDevDeps = ['jest', 'eslint', 'prettier', 'supertest'];
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const devDeps = packageJson.devDependencies || {};

    requiredDevDeps.forEach(dep => {
      if (devDeps[dep]) {
        log(`✓ ${dep}`, 'green');
      } else {
        log(`✗ ${dep}`, 'red');
        allChecks = false;
      }
    });
  } catch (error) {
    log('✗ Could not check dependencies', 'red');
    allChecks = false;
  }

  // Test commands
  log('\n⚡ Command Tests:', 'blue');
  allChecks &= runCommand('npm run lint --silent', 'ESLint execution');
  allChecks &= runCommand('npm run format:check --silent', 'Prettier check');

  // Check if MongoDB is available (optional)
  log('\n🗄️  Database Connectivity:', 'blue');
  try {
    execSync('which mongod', { stdio: 'pipe' });
    log('✓ MongoDB binary found', 'green');
  } catch (error) {
    log('⚠ MongoDB binary not found (Docker can be used instead)', 'yellow');
  }

  // Check Docker availability
  log('\n🐳 Docker Availability:', 'blue');
  if (runCommand('docker --version', 'Docker installation')) {
    runCommand('docker-compose --version', 'Docker Compose installation');
  }

  // Final summary
  log('\n📊 Summary:', 'blue');
  if (allChecks) {
    log('🎉 All checks passed! Your CI setup is ready.', 'green');
    log('\nNext steps:', 'blue');
    log('1. Run: npm run ci:test', 'reset');
    log(
      '2. Install Act: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash',
      'reset'
    );
    log('3. Test locally: act -j lint', 'reset');
    process.exit(0);
  } else {
    log('❌ Some checks failed. Please review the errors above.', 'red');
    log('\nTo fix issues, run:', 'blue');
    log('1. ./setup-ci-local.sh', 'reset');
    log('2. npm install', 'reset');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
