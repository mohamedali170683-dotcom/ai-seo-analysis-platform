/**
 * Tests for API utility functions
 */

import { NextResponse } from 'next/server';
import {
  apiSuccess,
  apiError,
  apiPaginated,
  parseJsonBody,
  getPaginationParams,
  getUserId,
  validateRequired,
  isValidId,
} from '@/lib/api/utils';
import { HTTP_STATUS, PAGINATION } from '@/lib/constants';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init })),
  },
}));

describe('API Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apiSuccess', () => {
    it('should create success response with data', () => {
      const data = { users: [{ id: '1', name: 'Test' }] };
      apiSuccess(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: true, ...data },
        { status: HTTP_STATUS.OK }
      );
    });

    it('should use custom status code', () => {
      apiSuccess({ created: true }, HTTP_STATUS.CREATED);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.anything(),
        { status: HTTP_STATUS.CREATED }
      );
    });
  });

  describe('apiError', () => {
    it('should create error response', () => {
      apiError('Something went wrong', HTTP_STATUS.BAD_REQUEST);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Something went wrong' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    });

    it('should include details when provided', () => {
      apiError('Validation failed', HTTP_STATUS.BAD_REQUEST, { field: 'email' });

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Validation failed', details: { field: 'email' } },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    });

    it('should default to 500 status', () => {
      apiError('Internal error');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.anything(),
        { status: HTTP_STATUS.INTERNAL_ERROR }
      );
    });
  });

  describe('apiPaginated', () => {
    it('should create paginated response', () => {
      const data = [{ id: '1' }, { id: '2' }];
      apiPaginated(data, { page: 1, limit: 20, total: 100 });

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      });
    });

    it('should calculate totalPages correctly', () => {
      apiPaginated([], { page: 1, limit: 10, total: 25 });

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 3,
          }),
        })
      );
    });
  });

  describe('parseJsonBody', () => {
    it('should parse valid JSON body', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'test' }),
      } as unknown as Request;

      const [body, error] = await parseJsonBody(mockRequest);

      expect(body).toEqual({ name: 'test' });
      expect(error).toBeNull();
    });

    it('should return error for invalid JSON', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Request;

      const [body, error] = await parseJsonBody(mockRequest);

      expect(body).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('getPaginationParams', () => {
    it('should return default values when no params', () => {
      const params = new URLSearchParams();
      const result = getPaginationParams(params);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(PAGINATION.DEFAULT_PAGE_SIZE);
      expect(result.skip).toBe(0);
    });

    it('should parse page and limit', () => {
      const params = new URLSearchParams({ page: '3', limit: '50' });
      const result = getPaginationParams(params);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(100); // (3-1) * 50
    });

    it('should enforce minimum page of 1', () => {
      const params = new URLSearchParams({ page: '-5' });
      const result = getPaginationParams(params);

      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const params = new URLSearchParams({ limit: '500' });
      const result = getPaginationParams(params);

      expect(result.limit).toBe(PAGINATION.MAX_PAGE_SIZE);
    });
  });

  describe('getUserId', () => {
    it('should return userId from params', () => {
      const params = new URLSearchParams({ userId: 'user-123' });
      expect(getUserId(params)).toBe('user-123');
    });

    it('should return demo-user as default', () => {
      const params = new URLSearchParams();
      expect(getUserId(params)).toBe('demo-user');
    });
  });

  describe('validateRequired', () => {
    it('should return null when all fields present', () => {
      const result = validateRequired(
        { name: 'Test', email: 'test@example.com' },
        ['name', 'email']
      );
      expect(result).toBeNull();
    });

    it('should return error message for missing fields', () => {
      const result = validateRequired(
        { name: 'Test' },
        ['name', 'email', 'password']
      );
      expect(result).toBe('Missing required fields: email, password');
    });

    it('should handle empty values as missing', () => {
      const result = validateRequired(
        { name: '', email: null },
        ['name', 'email']
      );
      expect(result).toBe('Missing required fields: name, email');
    });
  });

  describe('isValidId', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidId('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true);
    });

    it('should accept valid CUIDs', () => {
      expect(isValidId('clh2v0x0i0000qw1x2y3z4w5v')).toBe(true);
    });

    it('should reject invalid IDs', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('invalid-id')).toBe(false);
      expect(isValidId('123')).toBe(false);
    });
  });
});
