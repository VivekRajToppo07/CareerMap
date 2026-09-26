import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server.ts';

// Mock Vite to prevent starting the real vite server in the test
vi.mock('vite', () => ({
  createServer: vi.fn().mockResolvedValue({
    middlewares: (req: any, res: any, next: any) => next()
  })
}));

// Mock LangChain's ChatPromptTemplate to throw an error when generating roadmap
vi.mock('@langchain/core/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    ChatPromptTemplate: {
      fromMessages: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue({
          pipe: vi.fn().mockReturnValue({
            invoke: vi.fn().mockRejectedValue(new Error("Mocked LLM generation error"))
          })
        })
      }),
      fromTemplate: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue({
          pipe: vi.fn().mockReturnValue({
            invoke: vi.fn().mockRejectedValue(new Error("Mocked LLM generation error"))
          })
        })
      })
    }
  };
});

describe('POST /api/roadmap Error Handling', () => {
  it('should return 500 when roadmap generation fails', async () => {
    process.env.GROQ_API_KEY = "mock-key";
    const response = await request(app)
      .post('/api/roadmap')
      .send({ pathTitle: 'Frontend Developer' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Mocked LLM generation error"
    });
  });
});
