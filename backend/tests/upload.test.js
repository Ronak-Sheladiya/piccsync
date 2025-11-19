const request = require('supertest');
const express = require('express');
const uploadRoutes = require('../src/routes/upload');

// Mock dependencies
jest.mock('../src/services/supabaseClient');
jest.mock('../src/config/r2');
jest.mock('../src/middleware/verifySupabaseAuth', () => (req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

const app = express();
app.use(express.json());
app.use('/api', uploadRoutes);

describe('Upload Routes', () => {
  test('GET /api/photos should return user photos', async () => {
    const { supabase } = require('../src/services/supabaseClient');
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    const response = await request(app)
      .get('/api/photos')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/upload should require file', async () => {
    const response = await request(app)
      .post('/api/upload')
      .expect(400);

    expect(response.body.error).toBe('No file provided');
  });
});

module.exports = app;