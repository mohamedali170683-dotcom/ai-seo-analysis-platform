/**
 * Tests for error handling utilities
 */

import {
  getErrorMessage,
  getErrorStack,
  isErrorType,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  ConfigurationError,
  toErrorResponse,
  tryCatch,
  tryCatchSync,
} from '@/lib/utils/errors';
import { HTTP_STATUS } from '@/lib/constants';

describe('Error Utilities', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from object with message property', () => {
      const error = { message: 'Object error' };
      expect(getErrorMessage(error)).toBe('Object error');
    });

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
      expect(getErrorMessage(123)).toBe('An unknown error occurred');
    });
  });

  describe('getErrorStack', () => {
    it('should extract stack from Error instance', () => {
      const error = new Error('Test');
      expect(getErrorStack(error)).toBeDefined();
      expect(getErrorStack(error)).toContain('Error: Test');
    });

    it('should return undefined for non-Error types', () => {
      expect(getErrorStack('string error')).toBeUndefined();
      expect(getErrorStack({ message: 'object' })).toBeUndefined();
    });
  });

  describe('isErrorType', () => {
    it('should correctly identify error types', () => {
      const validationError = new ValidationError('Invalid input');
      const appError = new AppError('App error');

      expect(isErrorType(validationError, ValidationError)).toBe(true);
      expect(isErrorType(validationError, AppError)).toBe(true); // Inheritance
      expect(isErrorType(appError, ValidationError)).toBe(false);
    });
  });
});

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_ERROR);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create error with custom options', () => {
      const error = new AppError('Custom error', {
        statusCode: 418,
        code: 'TEAPOT',
        isOperational: false,
        context: { foo: 'bar' },
      });

      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('TEAPOT');
      expect(error.isOperational).toBe(false);
      expect(error.context).toEqual({ foo: 'bar' });
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test', { code: 'TEST', context: { id: 1 } });
      const json = error.toJSON();

      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test');
      expect(json.code).toBe('TEST');
      expect(json.context).toEqual({ id: 1 });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with fields', () => {
      const error = new ValidationError('Validation failed', {
        fields: {
          email: ['Invalid email format'],
          password: ['Too short', 'Must contain number'],
        },
      });

      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.fields).toEqual({
        email: ['Invalid email format'],
        password: ['Too short', 'Must contain number'],
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create auth error with correct status', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authz error with correct status', () => {
      const error = new AuthorizationError();

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe("User with id '123' not found");
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.context).toEqual({ resource: 'User', identifier: '123' });
    });

    it('should handle missing identifier', () => {
      const error = new NotFoundError('Analysis');
      expect(error.message).toBe('Analysis not found');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry info', () => {
      const error = new RateLimitError('Too many requests', 30);

      expect(error.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(error.retryAfter).toBe(30);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error', () => {
      const cause = new Error('Connection timeout');
      const error = new ExternalServiceError('OpenAI', 'API call failed', { cause });

      expect(error.message).toBe('API call failed');
      expect(error.service).toBe('OpenAI');
      expect(error.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(error.cause).toBe(cause);
    });
  });

  describe('ConfigurationError', () => {
    it('should create config error as non-operational', () => {
      const error = new ConfigurationError('Missing API key');

      expect(error.isOperational).toBe(false);
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });
  });
});

describe('toErrorResponse', () => {
  it('should convert AppError to response format', () => {
    const error = new ValidationError('Invalid input', {
      context: { field: 'email' },
    });
    const { response, statusCode } = toErrorResponse(error);

    expect(statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(response.success).toBe(false);
    expect(response.error.message).toBe('Invalid input');
    expect(response.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle unknown errors', () => {
    const { response, statusCode } = toErrorResponse('Random string error');

    expect(statusCode).toBe(HTTP_STATUS.INTERNAL_ERROR);
    expect(response.error.code).toBe('INTERNAL_ERROR');
    expect(response.error.message).toBe('Random string error');
  });
});

describe('tryCatch', () => {
  it('should return data on success', async () => {
    const [result, error] = await tryCatch(Promise.resolve('success'));

    expect(result).toBe('success');
    expect(error).toBeNull();
  });

  it('should return error on failure', async () => {
    const [result, error] = await tryCatch(Promise.reject(new Error('Failed')));

    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Failed');
  });

  it('should convert non-Error rejects to Error', async () => {
    const [result, error] = await tryCatch(Promise.reject('string rejection'));

    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('string rejection');
  });
});

describe('tryCatchSync', () => {
  it('should return data on success', () => {
    const [result, error] = tryCatchSync(() => 'success');

    expect(result).toBe('success');
    expect(error).toBeNull();
  });

  it('should return error on throw', () => {
    const [result, error] = tryCatchSync(() => {
      throw new Error('Sync error');
    });

    expect(result).toBeNull();
    expect(error?.message).toBe('Sync error');
  });
});
