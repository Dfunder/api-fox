const request = require('supertest');

// Mock dependencies before requiring app
jest.mock('../models/User.model', () => {
  const mockSave = jest.fn();
  const MockUser = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = '507f1f77bcf86cd799439011';
    this.role = 'user';
    this.isVerified = false;
    this.createdAt = new Date('2026-01-01T00:00:00.000Z');
    this.save = mockSave;
  });
  MockUser.findOne = jest.fn();
  MockUser._mockSave = mockSave;
  return MockUser;
});

jest.mock('../services/email.service', () => ({
  sendEmail: jest.fn(),
}));

const User = require('../models/User.model');
const { sendEmail } = require('../services/email.service');
const app = require('../app');

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User._mockSave.mockResolvedValue(undefined);
  });

  const validBody = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    password: 'securePass1',
  };

  describe('successful registration', () => {
    it('returns 201 with user data and sends a verification email', async () => {
      User.findOne.mockResolvedValue(null); // no existing user
      sendEmail.mockResolvedValue({ messageId: 'test-id' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'User registered successfully. Please verify your email.'
      );

      const { user } = response.body.data;
      expect(user.email).toBe('jane@example.com');
      expect(user.isVerified).toBe(false);
      // Token must NOT be exposed in the response
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.emailVerificationExpires).toBeUndefined();

      // Verify the email was sent
      expect(sendEmail).toHaveBeenCalledTimes(1);
      const emailCall = sendEmail.mock.calls[0][0];
      expect(emailCall.to).toBe('jane@example.com');
      expect(emailCall.subject).toContain('erif'); // "Verify"
      expect(emailCall.html).toBeDefined();
    });

    it('stores emailVerificationToken and emailVerificationExpires on the user', async () => {
      User.findOne.mockResolvedValue(null);
      sendEmail.mockResolvedValue({});

      let capturedInstance;
      User.mockImplementationOnce(function (data) {
        Object.assign(this, data);
        this._id = '507f1f77bcf86cd799439011';
        this.role = 'user';
        this.isVerified = false;
        this.createdAt = new Date();
        this.save = User._mockSave;
        capturedInstance = this;
      });

      await request(app).post('/api/auth/register').send(validBody).expect(201);

      expect(capturedInstance.emailVerificationToken).toBeDefined();
      expect(typeof capturedInstance.emailVerificationToken).toBe('string');
      expect(capturedInstance.emailVerificationToken).toHaveLength(64); // 32 bytes hex
      expect(capturedInstance.emailVerificationExpires).toBeInstanceOf(Date);
      // Expiry should be ~24 hours from now
      const msUntilExpiry =
        capturedInstance.emailVerificationExpires.getTime() - Date.now();
      expect(msUntilExpiry).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(msUntilExpiry).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    });
  });

  describe('duplicate email', () => {
    it('returns 409 when the email is already registered', async () => {
      User.findOne.mockResolvedValue({ email: 'jane@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validBody)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists');
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('validation errors', () => {
    it('returns 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ fullName: 'Jane', password: 'securePass1' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns 400 when password is too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Jane',
          email: 'jane@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('email send failure', () => {
    it('still returns 201 even when the email service throws', async () => {
      User.findOne.mockResolvedValue(null);
      sendEmail.mockRejectedValue(new Error('SMTP unavailable'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      // Registration succeeds — the token is stored in the DB even if email fails
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('jane@example.com');
    });
  });
});
