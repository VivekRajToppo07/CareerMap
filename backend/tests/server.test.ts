import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server.ts';

// Mock dependencies
vi.mock('../src/middleware/auth.ts', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.dbUser = { id: 1 };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => next()
}));

vi.mock('../src/db/index.ts', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error('Database error'))
      })
    })
  }
}));

describe('POST /api/save-assessment', () => {
  it('should return 500 when saving assessment to database fails', async () => {
    const response = await request(app)
      .post('/api/save-assessment')
      .send({
        answers: {
          degree: 'BS',
          experience: 'None',
          internships: 'None',
          projects: 'None',
          programmingLanguages: 'JS',
          interests: 'Web',
          workStyle: 'Solo'
        },
        profile: 'Test profile',
        paths: []
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to save assessment to database.',
      cause: 'Database error'
    });
  });
});
