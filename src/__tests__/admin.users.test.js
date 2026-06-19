const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const User = require('../models/User.model');
const app = require('../app');

describe('Admin user management routes', () => {
  const adminId = '507f1f77bcf86cd799439099';
  const targetUserId = '507f1f77bcf86cd799439011';
  let token;

  beforeAll(() => {
    token = jwt.sign(
      { sub: adminId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockImplementation((id) => {
      if (id === adminId) {
        return Promise.resolve({
          _id: adminId,
          role: 'admin',
        });
      }
      if (id === targetUserId) {
        return Promise.resolve({
          _id: targetUserId,
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          role: 'user',
          isVerified: true,
          kycStatus: 'approved',
          kycSubmissionDate: new Date('2026-06-18T10:00:00.000Z'),
          kycReviewNotes: 'Documents verified',
          walletAddress: 'GABC123',
          avatar: 'uploads/avatar.png',
          deletedAt: null,
        });
      }
      return Promise.resolve(null);
    });
  });

  it('returns full user details for a valid admin request', async () => {
    const response = await request(app)
      .get(`/api/admin/users/${targetUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User retrieved successfully');
    expect(response.body.data).toMatchObject({
      id: targetUserId,
      email: 'jane@example.com',
      role: 'user',
      kycStatus: 'approved',
    });
  });

  it('returns 404 when the requested user does not exist', async () => {
    const response = await request(app)
      .get('/api/admin/users/507f1f77bcf86cd799439999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('User not found');
  });

  it('updates a user role for another admin request', async () => {
    User.findByIdAndUpdate.mockResolvedValue({
      _id: targetUserId,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      role: 'admin',
      isVerified: true,
      kycStatus: 'approved',
      kycSubmissionDate: new Date('2026-06-18T10:00:00.000Z'),
      kycReviewNotes: 'Documents verified',
      walletAddress: 'GABC123',
      avatar: 'uploads/avatar.png',
      deletedAt: null,
    });

    const response = await request(app)
      .patch(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User role updated successfully');
    expect(response.body.data.role).toBe('admin');
  });

  it('prevents an admin from downgrading their own role', async () => {
    const response = await request(app)
      .patch(`/api/admin/users/${adminId}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You cannot change your own role');
  });
});
