const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/Project.model', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

const Project = require('../models/Project.model');
const User = require('../models/User.model');
const app = require('../app');

describe('GET /api/projects/:id', () => {
  const projectId = '507f1f77bcf86cd799439066';
  const ownerId = '507f1f77bcf86cd799439055';
  const adminId = '507f1f77bcf86cd799439099';

  const projectDoc = {
    _id: projectId,
    title: 'Campaign Test',
    description: 'A valid active campaign',
    owner: { _id: ownerId, fullName: 'Owner Name' },
    isActive: true,
    documents: [],
    toObject: function () {
      return {
        _id: this._id,
        title: this.title,
        description: this.description,
        owner: this.owner,
        isActive: this.isActive,
        documents: this.documents,
      };
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockImplementation((id) => {
      if (id === ownerId) {
        return Promise.resolve({ _id: ownerId, role: 'user' });
      }
      if (id === adminId) {
        return Promise.resolve({ _id: adminId, role: 'admin' });
      }
      return Promise.resolve(null);
    });
  });

  it('returns full project details for a valid active project id without auth', async () => {
    Project.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(projectDoc),
    });

    const response = await request(app).get(`/api/projects/${projectId}`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Project retrieved successfully');
    expect(response.body.data.project).toMatchObject({
      _id: projectId,
      title: 'Campaign Test',
      description: 'A valid active campaign',
      owner: { fullName: 'Owner Name' },
      isActive: true,
    });
  });

  it('returns 404 for a non-existent project id', async () => {
    Project.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(null),
    });

    const response = await request(app).get(`/api/projects/${projectId}`).expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Project not found');
  });

  it('returns 404 for an inactive project if requester is not owner/admin', async () => {
    Project.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce({
        ...projectDoc,
        isActive: false,
      }),
    });

    const response = await request(app).get(`/api/projects/${projectId}`).expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Project not found');
  });

  it('returns inactive project details to owner', async () => {
    const token = jwt.sign(
      { sub: ownerId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    Project.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce({
        ...projectDoc,
        isActive: false,
      }),
    });

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.project.owner).toEqual({ fullName: 'Owner Name' });
  });

  it('returns inactive project details to admin', async () => {
    const token = jwt.sign(
      { sub: adminId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    Project.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce({
        ...projectDoc,
        isActive: false,
      }),
    });

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.project.owner).toEqual({ fullName: 'Owner Name' });
  });
});

describe('GET /api/projects', () => {
  it('returns active public projects with pagination metadata', async () => {
    const projectList = [
      {
        _id: '507f1f77bcf86cd799439066',
        title: 'Campaign A',
        description: 'Active campaign A',
        status: 'active',
        isActive: true,
        createdAt: new Date('2026-06-22T12:00:00Z'),
      },
      {
        _id: '507f1f77bcf86cd799439067',
        title: 'Campaign B',
        description: 'Active campaign B',
        status: 'active',
        isActive: true,
        createdAt: new Date('2026-06-21T12:00:00Z'),
      },
    ];

    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(projectList),
    };

    Project.find.mockReturnValue(chain);
    Project.countDocuments.mockResolvedValue(2);

    const response = await request(app).get('/api/projects?page=1&limit=2').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.data).toHaveLength(2);
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(2);
    expect(response.body.data.totalPages).toBe(1);
    expect(Project.find).toHaveBeenCalledWith({ status: 'active', isActive: true });
  });

  it('supports search and category filtering', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    Project.find.mockReturnValue(chain);
    Project.countDocuments.mockResolvedValue(0);

    await request(app)
      .get('/api/projects?search=water&category=Energy&page=2&limit=5')
      .expect(200);

    expect(Project.find).toHaveBeenCalledWith({
      status: 'active',
      isActive: true,
      category: 'Energy',
      $or: [
        { title: { $regex: 'water', $options: 'i' } },
        { description: { $regex: 'water', $options: 'i' } },
      ],
    });
  });
});
