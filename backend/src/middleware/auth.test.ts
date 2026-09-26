import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, AuthRequest } from './auth';
import { Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin';
import { getOrCreateUser } from '../db/users';

// Mock dependencies
vi.mock('../lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock('../db/users', () => ({
  getOrCreateUser: vi.fn(),
}));

describe('requireAuth middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
    vi.clearAllMocks();
  });

  it('should return 401 if authorization header is missing', async () => {
    await requireAuth(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing token' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with "Bearer "', async () => {
    mockReq.headers!.authorization = 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=';

    await requireAuth(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing token' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    mockReq.headers!.authorization = 'Bearer invalid-token';
    const error = new Error('Invalid token');
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(error);

    // Mock console.error to prevent it from cluttering the test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await requireAuth(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('invalid-token');
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
    expect(nextFunction).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should populate req.user and req.dbUser and call next() if token is valid', async () => {
    mockReq.headers!.authorization = 'Bearer valid-token';
    const decodedToken = { uid: 'user-123', email: 'test@example.com' };
    const dbUser = { id: 1, uid: 'user-123', email: 'test@example.com' };

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(decodedToken as any);
    vi.mocked(getOrCreateUser).mockResolvedValue(dbUser);

    await requireAuth(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(getOrCreateUser).toHaveBeenCalledWith('user-123', 'test@example.com');
    expect(mockReq.user).toEqual(decodedToken);
    expect(mockReq.dbUser).toEqual(dbUser);
    expect(nextFunction).toHaveBeenCalled();
  });
});
