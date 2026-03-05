const request = require('supertest');

// helper to load app with fresh environment variables
function loadAppWithEnv(env = {}) {
  // clear cache so that modules pick up new env values
  jest.resetModules();
  Object.assign(process.env, env);
  return require('../app');
}

describe('Rate limiting middleware', () => {
  beforeEach(() => {
    // make sure we start from a clean state
    jest.resetModules();
  });

  it('enforces the global limit and returns Retry-After header', async () => {
    const app = loadAppWithEnv({
      RATE_LIMIT_WINDOW_MS: '1000',
      RATE_LIMIT_MAX: '2',
    });

    // first two requests should succeed
    await request(app).get('/api/health').expect(200);
    await request(app).get('/api/health').expect(200);

    // third request should be blocked
    const res = await request(app).get('/api/health').expect(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 429,
      message: expect.stringContaining('Too many requests'),
    });
  });

  it('enforces a stricter limit on auth routes', async () => {
    const app = loadAppWithEnv({
      RATE_LIMIT_WINDOW_MS: '1000',
      AUTH_RATE_LIMIT_MAX: '1',
    });

    // first auth request should go through (payload may be invalid, but not a rate-limit error)
    await request(app).post('/api/auth/login').send({}).expect(res => {
      expect([200, 400, 401, 422]).toContain(res.status);
    });

    // second request should hit the limit
    const res = await request(app).post('/api/auth/login').send({}).expect(429);
    expect(res.headers['retry-after']).toBeDefined();
  });
});
