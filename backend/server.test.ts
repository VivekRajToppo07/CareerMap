import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock the modules before they are imported by server.ts
vi.mock("@langchain/groq", () => {
    return {
        ChatGroq: class {
            constructor() {}
            pipe() { return this; }
        }
    };
});

vi.mock("@langchain/core/prompts", async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        ChatPromptTemplate: {
            fromMessages: vi.fn().mockImplementation(() => {
                return {
                    pipe: vi.fn().mockImplementation(() => {
                        return {
                            pipe: vi.fn().mockImplementation(() => {
                                return {
                                    invoke: vi.fn().mockImplementation(() => {
                                        throw new Error("Simulated LLM Error");
                                    })
                                }
                            })
                        }
                    })
                };
            }),
            fromTemplate: vi.fn().mockImplementation(() => {
                return {
                    pipe: vi.fn().mockReturnThis()
                }
            })
        }
    };
});

describe('Chat Endpoint Error Handling', () => {
    beforeAll(async () => {
        // Set environment variable before server imports it
        process.env.GROQ_API_KEY = "dummy";
        // dynamic import of the server script
        await import('./server.js').catch(async () => {
            await import('./server.ts');
        });

        // Wait briefly for the server to start
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterAll(() => {
        // Simple clean up isn't provided by server.ts, so vitest will clean up process after all tests end.
    });

    it('should catch error and return status 500 with proper message', async () => {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "hello", history: [], context: {} })
        });

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe("Failed to process chat.");
    });
});
