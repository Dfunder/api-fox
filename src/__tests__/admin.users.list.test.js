const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const User = require('../models/User.model');
const app = require('../app');

describe('GET /api/admin/users', () => {
  const adminId = '507f1f77bcf86cd799439010';
  const userId = '507f1f77bcf86cd799439011';
  const secret = process.env.JWT_SECRET || 'test-secret';

  const adminToken = jwt.sign({ sub: adminId, type: 'access' }, secret, {
    expiresIn: '1h',
  });
  const userToken = jwt.sign({ sub: userId, type: 'access' }, secret, {
    expiresIn: '1h',
  });

  const buildFindChain = (users = []) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(users),
    };
    User.find.mockReturnValue(chain);
    return chain;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a paginated list of users for admins', async () => {
    const users = [
      {
        _id: userId,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
        kycStatus: 'approved',
      },
    ];
    const chain = buildFindChain(users);

    User.findById.mockResolvedValue({ _id: adminId, role: 'admin' });
    User.countDocuments.mockResolvedValue(21);

    const response = await request(app)
      .get('/api/admin/users?page=2&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(User.find).toHaveBeenCalledWith({ deletedAt: null });
    expect(chain.skip).toHaveBeenCalledWith(10);
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(User.countDocuments).toHaveBeenCalledWith({ deletedAt: null });
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      data: users,
      total: 21,
      page: 2,
      totalPages: 3,
    });
  });

  it('supports search, role, and KYC status filters', async () => {
    const chain = buildFindChain([]);

    User.findById.mockResolvedValue({ _id: adminId, role: 'admin' });
    User.countDocuments.mockResolvedValue(0);

    await request(app)
      .get('/api/admin/users?search=jane@example.com&role=user&kycStatus=approved')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const expectedQuery = {
      deletedAt: null,
      $or: [
        { fullName: { $regex: 'jane@example\\.com', $options: 'i' } },
        { email: { $regex: 'jane@example\\.com', $options: 'i' } },
      ],
      role: 'user',
      kycStatus: 'approved',
    };

    expect(User.find).toHaveBeenCalledWith(expectedQuery);
    expect(User.countDocuments).toHaveBeenCalledWith(expectedQuery);
    expect(chain.skip).toHaveBeenCalledWith(0);
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('returns 403 for authenticated non-admin users', async () => {
    buildFindChain([]);

    User.findById.mockResolvedValue({ _id: userId, role: 'user' });

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Admin access required');
    expect(User.find).not.toHaveBeenCalled();
    expect(User.countDocuments).not.toHaveBeenCalled();
  });
});
