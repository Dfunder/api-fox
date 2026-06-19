const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

jest.mock('../services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test' }),
}));

const User = require('../models/User.model');
const { sendEmail } = require('../services/email.service');
const app = require('../app');

describe('PATCH /api/admin/kyc/:id', () => {
  const adminId = '507f1f77bcf86cd799439010';
  const targetId = '507f1f77bcf86cd799439011';
  const secret = process.env.JWT_SECRET || 'test-secret';

  const adminToken = jwt.sign({ sub: adminId, type: 'access' }, secret, {
    expiresIn: '1h',
  });
  const userToken = jwt.sign({ sub: targetId, type: 'access' }, secret, {
    expiresIn: '1h',
  });

  const adminUser = { _id: adminId, role: 'admin', email: 'admin@test.io' };

  const buildTargetUser = () => ({
    _id: targetId,
    id: targetId,
    role: 'user',
    email: 'user@test.io',
    fullName: 'Jane Doe',
    kycStatus: 'pending',
    kycReviewNotes: null,
    save: jest.fn().mockResolvedValue(true),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const response = await request(app)
      .patch(`/api/admin/kyc/${targetId}`)
      .send({ status: 'approved' })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('rejects non-admin users', async () => {
    User.findById.mockResolvedValueOnce({ _id: targetId, role: 'user' });

    const response = await request(app)
      .patch(`/api/admin/kyc/${targetId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'approved' })
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('rejects an invalid status value', async () => {
    User.findById.mockResolvedValueOnce(adminUser);

    const response = await request(app)
      .patch(`/api/admin/kyc/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'maybe' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('returns 404 when the target user does not exist', async () => {
    User.findById
      .mockResolvedValueOnce(adminUser) // auth middleware
      .mockResolvedValueOnce(null); // controller lookup

    const response = await request(app)
      .patch(`/api/admin/kyc/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('User not found');
  });

  it('approves a KYC submission and emails the user', async () => {
    const target = buildTargetUser();
    User.findById
      .mockResolvedValueOnce(adminUser) // auth middleware
      .mockResolvedValueOnce(target); // controller lookup

    const response = await request(app)
      .patch(`/api/admin/kyc/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved', reviewNote: 'Documents verified' })
      .expect(200);

    expect(target.kycStatus).toBe('approved');
    expect(target.kycReviewNotes).toBe('Documents verified');
    expect(target.save).toHaveBeenCalledTimes(1);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe('user@test.io');

    expect(response.body.success).toBe(true);
    expect(response.body.data.kycStatus).toBe('approved');
    expect(response.body.data.kycReviewNotes).toBe('Documents verified');
  });

  it('rejects a KYC submission', async () => {
    const target = buildTargetUser();
    User.findById
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(target);

    const response = await request(app)
      .patch(`/api/admin/kyc/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' })
      .expect(200);

    expect(target.kycStatus).toBe('rejected');
    expect(target.save).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(response.body.data.kycStatus).toBe('rejected');
  });
});
