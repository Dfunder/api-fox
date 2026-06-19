const User = require('../models/User.model');
const { updateUserRole } = require('../controllers/admin.users.controller');

jest.mock('../models/User.model', () => ({
  findById: jest.fn(),
}));

describe('Admin user role management', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'admin' },
      userId: '507f1f77bcf86cd799439012',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  it('allows an admin to promote another user', async () => {
    const user = {
      id: '507f1f77bcf86cd799439011',
      email: 'alice@example.com',
      role: 'user',
      save: jest.fn().mockResolvedValue(undefined),
    };

    User.findById.mockResolvedValue(user);

    await updateUserRole(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(user.role).toBe('admin');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      message: 'User role updated successfully',
      data: {
        id: '507f1f77bcf86cd799439011',
        email: 'alice@example.com',
        role: 'admin',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid role values', async () => {
    req.body.role = 'superadmin';

    await updateUserRole(req, res, next);

    expect(User.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: 'Role must be either user or admin',
      data: {},
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks admins from downgrading their own role', async () => {
    req.userId = '507f1f77bcf86cd799439011';
    req.body.role = 'user';

    await updateUserRole(req, res, next);

    expect(User.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 403,
      message: 'You cannot downgrade your own role',
      data: {},
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when the user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    await updateUserRole(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 404,
      message: 'User not found',
      data: {},
    });
    expect(next).not.toHaveBeenCalled();
  });
});
