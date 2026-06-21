const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/Project.model', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

const Project = require('../models/Project.model');
const User = require('../models/User.model');
const app = require('../app');

describe('GET /api/projects/:id', () => {
  const projectId = '507f1f77bcf86cd799439000';
  const ownerId = '507f1f77bcf86cd799439001';
  const adminId = '507f1f77bcf86cd799439099';
  let ownerToken;
  let adminToken;

  beforeAll(() => {
    ownerToken = jwt.sign(
      { sub: ownerId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { sub: adminId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const projectResponse = (data) => ({
    ...data,
    toObject() {
      return {
        ...data,
        owner: data.owner,
      };
    },
  });

  it('returns full project details for a valid active project ID without auth', async () => {
    const project = projectResponse({
      _id: projectId,
      title: 'Campaign One',
      description: 'A great initiative',
      status: 'active',
      owner: { _id: ownerId, fullName: 'Alice Cooper' },
      documents: [],
    });

    Project.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(project),
    });

    const response = await request(app).get(`/api/projects/${projectId}`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      title: 'Campaign One',
      description: 'A great initiative',
      status: 'active',
      owner: { fullName: 'Alice Cooper' },
    });
  });

  it('returns 404 for an inactive project when not authenticated', async () => {
    const project = projectResponse({
      _id: projectId,
      title: 'Campaign One',
      description: 'A great initiative',
      status: 'inactive',
      owner: { _id: ownerId, fullName: 'Alice Cooper' },
      documents: [],
    });

    Project.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(project),
    });

    const response = await request(app).get(`/api/projects/${projectId}`).expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Project not found');
  });

  it('returns full project details for an inactive project when requested by the owner', async () => {
    const project = projectResponse({
      _id: projectId,
      title: 'Campaign One',
      description: 'A great initiative',
      status: 'inactive',
      owner: { _id: ownerId, fullName: 'Alice Cooper' },
      documents: [],
    });

    Project.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(project),
    });
    User.findById.mockResolvedValue({ _id: ownerId, role: 'user' });

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.owner).toEqual({ fullName: 'Alice Cooper' });
  });

  it('returns full project details for an inactive project when requested by an admin', async () => {
    const project = projectResponse({
      _id: projectId,
      title: 'Campaign One',
      description: 'A great initiative',
      status: 'inactive',
      owner: { _id: ownerId, fullName: 'Alice Cooper' },
      documents: [],
    });

    Project.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(project),
    });
    User.findById.mockResolvedValue({ _id: adminId, role: 'admin' });

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.owner).toEqual({ fullName: 'Alice Cooper' });
  });

  it('returns 404 when project does not exist', async () => {
    Project.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app).get(`/api/projects/${projectId}`).expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Project not found');
  });
});
