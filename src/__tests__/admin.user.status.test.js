const request = require('supertest');

jest.mock('../models/User.model', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
  decode: jest.fn(),
}));

const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const app = require('../app');

const adminToken = 'Bearer admin-token';
const adminPayload = { sub: 'admin-id', email: 'admin@example.com', role: 'admin', type: 'access' };
const adminUser = { _id: 'admin-id', id: 'admin-id', email: 'admin@example.com', role: 'admin', deletedAt: null };

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue(adminPayload);
  User.findById.mockResolvedValue(adminUser);
});

describe('PATCH /api/admin/users/:id/status', () => {
  const targetUser = {
    id: 'user-id-123',
    email: 'user@example.com',
    fullName: 'Test User',
    status: 'suspended',
  };

  it('suspends an active user', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({ ...targetUser, status: 'suspended' }),
    });

    const res = await request(app)
      .patch('/api/admin/users/user-id-123/status')
      .set('Authorization', adminToken)
      .send({ status: 'suspended' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('suspended');
  });

  it('reactivates a suspended user', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({ ...targetUser, status: 'active' }),
    });

    const res = await request(app)
      .patch('/api/admin/users/user-id-123/status')
      .set('Authorization', adminToken)
      .send({ status: 'active' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('active');
  });

  it('returns 400 for an invalid status value', async () => {
    const res = await request(app)
      .patch('/api/admin/users/user-id-123/status')
      .set('Authorization', adminToken)
      .send({ status: 'banned' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('returns 404 when user does not exist', async () => {
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .patch('/api/admin/users/nonexistent-id/status')
      .set('Authorization', adminToken)
      .send({ status: 'suspended' })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('returns 403 when admin tries to change their own status', async () => {
    const res = await request(app)
      .patch('/api/admin/users/admin-id/status')
      .set('Authorization', adminToken)
      .send({ status: 'suspended' })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .patch('/api/admin/users/user-id-123/status')
      .send({ status: 'suspended' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login - suspended user', () => {
  it('returns 403 when a suspended user tries to log in', async () => {
    jest.mock('bcryptjs', () => ({ compare: jest.fn().mockResolvedValue(true) }));

    const suspendedUser = {
      _id: 'user-id-123',
      email: 'suspended@example.com',
      role: 'user',
      isVerified: true,
      status: 'suspended',
      password: 'hashed-password',
      save: jest.fn(),
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(suspendedUser),
    });

    const bcrypt = require('bcryptjs');
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'suspended@example.com', password: 'password123' })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/suspended/i);
  });
});
