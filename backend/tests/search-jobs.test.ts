import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';

import { app } from '../server.ts';

describe('Search Jobs Endpoint', () => {
  it('should return a 500 error if fetching jobs fails', async () => {
    process.env.SERPER_API_KEY = 'test_serper_key';

    // Mock global.fetch to throw an error
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Simulated network failure'));

    const response = await request(app)
      .post('/api/search-jobs')
      .send({ query: 'Software Engineer' });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Simulated network failure');

    // Restore fetch spy
    fetchSpy.mockRestore();
  });
});
