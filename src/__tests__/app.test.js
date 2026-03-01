const request = require('supertest');
const app = require('../app');

describe('App', () => {
  describe('GET /api/health', () => {
    it('should return status ok', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
