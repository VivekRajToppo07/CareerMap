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

  it('should return a 400 error if query is not a string', async () => {
    const response = await request(app)
      .post('/api/search-jobs')
      .send({ query: { nested: 'object' } });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid query. Query must be a non-empty string.');
  });

  it('should return a 400 error if query is empty', async () => {
    const response = await request(app)
      .post('/api/search-jobs')
      .send({ query: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid query. Query must be a non-empty string.');
  });

  it('should return a 400 error if query is too long', async () => {
    const response = await request(app)
      .post('/api/search-jobs')
      .send({ query: 'a'.repeat(101) });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Query is too long. Maximum length is 100 characters.');
  });
});
