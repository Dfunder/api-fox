const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

describe('JWT Authentication Middleware', () => {
  let validToken;
  let expiredToken;

  beforeAll(() => {
    // Create a valid token for testing
    const payload = { id: 'test-user-id', email: 'test@example.com' };
    validToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    
    // Create an expired token
    expiredToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '-1h' });
  });

  describe('Protected routes without token', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('Protected routes with invalid token format', () => {
    test('should return 401 when token format is invalid (no Bearer prefix)', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', validToken)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid token format');
    });

    test('should return 401 when token is malformed', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Protected routes with expired token', () => {
    test('should return 401 when token is expired', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token expired');
    });
  });

  describe('Protected routes with valid token', () => {
    test('should return 200 when valid token is provided', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', 'test-user-id');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    test('should attach user data to request object', async () => {
      const response = await request(app)
        .get('/api/protected/dashboard')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', 'test-user-id');
    });
  });
});
