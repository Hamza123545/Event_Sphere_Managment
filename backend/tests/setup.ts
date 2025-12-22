/**
 * Jest test setup file
 * Global test configuration and setup
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/eventsphere-test';

// Increase timeout for integration tests
jest.setTimeout(30000);


