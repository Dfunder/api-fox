const crypto = require('crypto');
const request = require('supertest');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
  decode: jest.fn(),
}));

const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const app = require('../app');

describe('POST /api/auth/refresh-token', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns new tokens for valid refresh token', async () => {
    const refreshToken = 'valid-refresh-token';
    const expectedHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'john@example.com',
      role: 'user',
      refreshTokenHash: expectedHash,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      save: jest.fn().mockResolvedValue(undefined),
    };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    jwt.verify.mockReturnValue({
      sub: '507f1f77bcf86cd799439011',
      type: 'refresh',
    });

    jwt.sign
      .mockReturnValueOnce('new-access-token')
      .mockReturnValueOnce('new-refresh-token');
    jwt.decode.mockReturnValue({ exp: 1735689600 });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Token refreshed successfully');
    expect(response.body.data).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(jwt.verify).toHaveBeenCalledWith(
      refreshToken,
      'test-refresh-secret'
    );
    expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('returns 403 for invalid token type', async () => {
    jwt.verify.mockReturnValue({
      sub: '507f1f77bcf86cd799439011',
      type: 'access', // Wrong type
    });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'access-token' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid token type');
  });

  it('returns 403 when user not found', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    jwt.verify.mockReturnValue({
      sub: '507f1f77bcf86cd799439011',
      type: 'refresh',
    });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'valid-refresh-token' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('User not found');
  });

  it('returns 403 when refresh token hash does not match', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'john@example.com',
      role: 'user',
      refreshTokenHash: 'stored-hash',
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      save: jest.fn(),
    };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    jwt.verify.mockReturnValue({
      sub: '507f1f77bcf86cd799439011',
      type: 'refresh',
    });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'different-refresh-token' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid refresh token');
  });

  it('returns 403 when refresh token has expired', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'john@example.com',
      role: 'user',
      refreshTokenHash: 'valid-hash',
      refreshTokenExpiresAt: new Date(Date.now() - 1000), // Expired
      save: jest.fn(),
    };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    jwt.verify.mockReturnValue({
      sub: '507f1f77bcf86cd799439011',
      type: 'refresh',
    });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'valid-refresh-token' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Refresh token has expired');
  });

  it('returns 403 for malformed JWT', async () => {
    jwt.verify.mockImplementation(() => {
      const error = new Error('JsonWebTokenError');
      error.name = 'JsonWebTokenError';
      throw error;
    });

    const response = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'malformed-token' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid or expired refresh token');
  });

  it('returns 400 when refresh token is missing', async () => {
    const response = await request(app)
      .post('/api/auth/refresh-token')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
