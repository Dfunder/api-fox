const request = require('supertest');

// Mock User model before requiring app so the mock is in place at module load time
jest.mock('../models/User.model', () => ({
  findOne: jest.fn(),
}));

const User = require('../models/User.model');
const app = require('../app');

describe('GET /api/auth/verify-email/:token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful verification', () => {
    it('returns 200 and marks the user as verified', async () => {
      const token = 'a'.repeat(64); // 64 hex chars
      const user = {
        isVerified: false,
        emailVerificationToken: token,
        emailVerificationExpires: new Date(Date.now() + 60_000),
        save: jest.fn().mockResolvedValue(undefined),
      };

      User.findOne.mockResolvedValue(user);

      const response = await request(app)
        .get(`/api/auth/verify-email/${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Email verified successfully. You can now log in.'
      );

      // Verify the model was queried with the correct token and expiry check
      expect(User.findOne).toHaveBeenCalledWith({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: expect.any(Date) },
      });

      // Verify the user fields were updated before save
      expect(user.isVerified).toBe(true);
      expect(user.emailVerificationToken).toBeNull();
      expect(user.emailVerificationExpires).toBeNull();
      expect(user.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalid token', () => {
    it('returns 400 when no user matches the token', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/verify-email/invalidtoken123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Invalid or expired verification token'
      );
    });
  });

  describe('expired token', () => {
    it('returns 400 when the token exists but has already expired', async () => {
      // When the token is expired, the $gt query returns null — simulate that
      User.findOne.mockResolvedValue(null);

      const expiredToken = 'b'.repeat(64);

      const response = await request(app)
        .get(`/api/auth/verify-email/${expiredToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Invalid or expired verification token'
      );

      // Confirm the expiry filter was passed to the query
      expect(User.findOne).toHaveBeenCalledWith({
        emailVerificationToken: expiredToken,
        emailVerificationExpires: { $gt: expect.any(Date) },
      });
    });
  });

  describe('already verified token (token cleared)', () => {
    it('returns 400 when token fields have already been nulled out', async () => {
      // After a successful verification the token is set to null on the document,
      // so a second attempt finds no matching document.
      User.findOne.mockResolvedValue(null);

      const usedToken = 'c'.repeat(64);

      const response = await request(app)
        .get(`/api/auth/verify-email/${usedToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Invalid or expired verification token'
      );
    });
  });
});
