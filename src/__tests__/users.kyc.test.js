const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User.model');
const app = require('../app');

describe('GET /api/users/me/kyc', () => {
  const userId = '507f1f77bcf86cd799439011';
  let token;

  beforeAll(() => {
    token = jwt.sign(
      { sub: userId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/users/me/kyc').expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication required');
  });

  it('returns 404 when the current user has not submitted KYC', async () => {
    User.findById.mockResolvedValue({
      _id: userId,
      kycStatus: 'pending',
      kycSubmissionDate: null,
      kycReviewNotes: null,
    });

    const response = await request(app)
      .get('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No KYC submission found');
  });

  it('returns the current user KYC record when submitted', async () => {
    const submissionDate = new Date('2026-06-18T10:00:00.000Z');
    User.findById.mockResolvedValue({
      _id: userId,
      kycStatus: 'approved',
      kycSubmissionDate: submissionDate,
      kycReviewNotes: 'Documents verified',
    });

    const response = await request(app)
      .get('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('KYC status retrieved successfully');
    expect(response.body.data).toEqual({
      status: 'approved',
      submissionDate: submissionDate.toISOString(),
      reviewNotes: 'Documents verified',
    });
  });
});
