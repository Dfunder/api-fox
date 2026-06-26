const jwt = require('jsonwebtoken');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/KYC.model', () => ({
  create: jest.fn(),
}));

const User = require('../models/User.model');
const KYC = require('../models/KYC.model');
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

describe('POST /api/users/me/kyc', () => {
  const userId = '507f1f77bcf86cd799439011';
  let token;
  const dummyFilePath = path.join(__dirname, 'dummy.png');

  beforeAll(() => {
    token = jwt.sign(
      { sub: userId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    // Create dummy file for attachment
    fs.writeFileSync(dummyFilePath, 'dummy content');
  });

  afterAll(() => {
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
    // Clean up uploaded files in uploads/kyc
    const kycUploadDir = path.join(process.cwd(), 'uploads', 'kyc');
    if (fs.existsSync(kycUploadDir)) {
      const files = fs.readdirSync(kycUploadDir);
      for (const file of files) {
        if (file.startsWith(`kyc-${userId}-`)) {
          fs.unlinkSync(path.join(kycUploadDir, file));
        }
      }
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/users/me/kyc')
      .field('documentType', 'passport')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication required');
  });

  it('rejects duplicate submission if user has a pending KYC status', async () => {
    const mockUser = {
      _id: userId,
      kycStatus: 'pending',
      kycSubmissionDate: null,
      kycReviewNotes: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'passport')
      .attach('document', dummyFilePath)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('KYC submission already exists or is already approved');
  });

  it('rejects duplicate submission if user has an approved KYC status', async () => {
    const mockUser = {
      _id: userId,
      kycStatus: 'approved',
      kycSubmissionDate: new Date(),
      kycReviewNotes: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'passport')
      .attach('document', dummyFilePath)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('KYC submission already exists or is already approved');
  });

  it('rejects request if documentType is missing', async () => {
    const mockUser = {
      _id: userId,
      kycStatus: 'rejected', // User has a rejected KYC, so they should be allowed to submit again
      kycSubmissionDate: new Date(),
      kycReviewNotes: 'invalid document',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .attach('document', dummyFilePath)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Document type is required');
  });

  it('rejects request if documentType is invalid', async () => {
    const mockUser = {
      _id: userId,
      kycStatus: 'rejected',
      kycSubmissionDate: new Date(),
      kycReviewNotes: 'invalid document',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'invalid_type')
      .attach('document', dummyFilePath)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Document type must be one of: passport, national_id, driving_license');
  });

  it('rejects request if no file is uploaded', async () => {
    const mockUser = {
      _id: userId,
      kycStatus: 'rejected',
      kycSubmissionDate: new Date(),
      kycReviewNotes: 'invalid document',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'passport')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('KYC document file is required');
  });

  it('submits KYC successfully and updates user status to pending', async () => {
    const mockUser = {
      _id: userId,
      kycStatus: 'rejected',
      kycSubmissionDate: null,
      kycReviewNotes: 'rejected before',
      save: jest.fn().mockImplementation(function() {
        return Promise.resolve(this);
      }),
    };
    User.findById.mockResolvedValue(mockUser);

    const mockKyc = {
      _id: '607f1f77bcf86cd799439012',
      userId,
      documentType: 'passport',
      documentUrl: 'uploads/kyc/kyc-507f1f77bcf86cd799439011-mocked.png',
      status: 'pending',
      submittedAt: new Date('2026-06-26T01:00:00.000Z'),
    };
    KYC.create.mockResolvedValue(mockKyc);

    const response = await request(app)
      .post('/api/users/me/kyc')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'passport')
      .attach('document', dummyFilePath)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('KYC document submitted successfully');
    expect(response.body.data.documentType).toBe('passport');
    expect(response.body.data.status).toBe('pending');

    expect(User.findById).toHaveBeenCalledWith(userId);
    expect(KYC.create).toHaveBeenCalled();
    expect(mockUser.kycStatus).toBe('pending');
    expect(mockUser.kycReviewNotes).toBeNull();
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });
});
