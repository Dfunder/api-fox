const authorize = require('../middlewares/authorize');

describe('Authorize Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            user: null,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    it('should call next if user has an allowed role', () => {
        req.user = { role: 'admin' };
        const middleware = authorize('admin', 'superadmin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 401 if user is not authenticated', () => {
        req.user = null;
        const middleware = authorize('admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 401,
            message: 'Authentication required'
        }));
    });

    it('should return 403 if user role is not allowed', () => {
        req.user = { role: 'user' };
        const middleware = authorize('admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 403,
            message: 'Access forbidden: insufficient permissions'
        }));
    });

    it('should work with multiple allowed roles', () => {
        req.user = { role: 'editor' };
        const middleware = authorize('admin', 'editor');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });
});
