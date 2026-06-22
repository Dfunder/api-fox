const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/Project.model', () => ({
  create: jest.fn(),
}));

const User = require('../models/User.model');
const Project = require('../models/Project.model');
const app = require('../app');

describe('POST /api/projects', () => {
  const userId = '507f1f77bcf86cd799439011';
  const token = jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  const validPayload = {
    title: 'Clean Water Campaign',
    description: 'Providing clean water access for the community.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send(validPayload)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication required');
    expect(Project.create).not.toHaveBeenCalled();
  });

  it('returns 403 when the authenticated user is not KYC approved', async () => {
    User.findById.mockResolvedValue({
      _id: userId,
      kycStatus: 'pending',
    });

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('KYC approval is required to create a project');
    expect(Project.create).not.toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    User.findById.mockResolvedValue({
      _id: userId,
      kycStatus: 'approved',
    });

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hi' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Title must be at least 3 characters long');
    expect(response.body.message).toContain('Description is required');
    expect(Project.create).not.toHaveBeenCalled();
  });

  it('creates a pending project for a KYC-approved user', async () => {
    const createdProject = {
      _id: '607f1f77bcf86cd799439011',
      ...validPayload,
      owner: userId,
      status: 'pending',
      documents: [],
    };

    User.findById.mockResolvedValue({
      _id: userId,
      kycStatus: 'approved',
    });
    Project.create.mockResolvedValue(createdProject);

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload)
      .expect(201);

    expect(Project.create).toHaveBeenCalledWith({
      title: validPayload.title,
      description: validPayload.description,
      owner: userId,
      status: 'pending',
    });
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Project created successfully');
    expect(response.body.data).toEqual(createdProject);
  });
});
