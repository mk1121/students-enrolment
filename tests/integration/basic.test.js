const mongoose = require('mongoose');

describe('Basic Integration Tests', () => {
  test('should connect to test database', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('should use test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should have JWT secret configured', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
  });
}); 