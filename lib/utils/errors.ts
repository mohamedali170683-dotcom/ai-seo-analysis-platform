/**
 * Centralized error handling utilities.
 *
 * This module provides:
 * - Type-safe error handling for catch blocks
 * - Custom error classes for different error types
 * - Error serialization for API responses
 *
 * Usage:
 * import { getErrorMessage, AppError, ValidationError } from '@/lib/utils/errors';
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   logger.error('Operation failed', error);
 * }
 */

import { HTTP_STATUS } from '@/lib/constants';

// =============================================================================
// ERROR MESSAGE EXTRACTION
// =============================================================================

/**
 * Safely extract error message from unknown error type.
 * Use this in catch blocks instead of `error: any`.
 *
 * @example
 * try {
 *   await fetch(url);
 * } catch (error) {
 *   console.error(getErrorMessage(error));
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

/**
 * Safely extract error stack from unknown error type.
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Check if error is an instance of a specific error class
 */
export function isErrorType<T extends Error>(
  error: unknown,
  ErrorClass: new (...args: unknown[]) => T
): error is T {
  return error instanceof ErrorClass;
}

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: string;
      isOperational?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode ?? HTTP_STATUS.INTERNAL_ERROR;
    this.code = options.code ?? 'INTERNAL_ERROR';
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;

    if (options.cause) {
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

/**
 * Validation error - thrown when input validation fails
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    options: {
      fields?: Record<string, string[]>;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      context: options.context,
    });
    this.fields = options.fields;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields,
    };
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: 'AUTHENTICATION_ERROR',
    });
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: 'AUTHORIZATION_ERROR',
    });
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(message, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: 'NOT_FOUND',
      context: { resource, identifier },
    });
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      code: 'RATE_LIMIT_EXCEEDED',
      context: { retryAfter },
    });
    this.retryAfter = retryAfter;
  }
}

/**
 * External service error (API failures, etc.)
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string,
    options: { cause?: Error; context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      code: 'EXTERNAL_SERVICE_ERROR',
      context: { service, ...options.context },
      cause: options.cause,
    });
    this.service = service;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, {
      statusCode: HTTP_STATUS.INTERNAL_ERROR,
      code: 'CONFIGURATION_ERROR',
      isOperational: false,
    });
  }
}

// =============================================================================
// ERROR RESPONSE HELPERS
// =============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Convert an error to a standard API response format
 */
export function toErrorResponse(error: unknown): {
  response: ErrorResponse;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      response: {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.context,
        },
      },
      statusCode: error.statusCode,
    };
  }

  // For unknown errors, return a generic response
  return {
    response: {
      success: false,
      error: {
        message: getErrorMessage(error),
        code: 'INTERNAL_ERROR',
      },
    },
    statusCode: HTTP_STATUS.INTERNAL_ERROR,
  };
}

// =============================================================================
// ASYNC ERROR HANDLING
// =============================================================================

/**
 * Wrap an async function to catch errors and return a result tuple.
 * Useful for avoiding try/catch blocks.
 *
 * @example
 * const [result, error] = await tryCatch(fetchData());
 * if (error) {
 *   console.error('Failed:', error.message);
 *   return;
 * }
 * console.log('Success:', result);
 */
export async function tryCatch<T>(
  promise: Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(getErrorMessage(error));
    return [null, err];
  }
}

/**
 * Wrap a sync function to catch errors and return a result tuple.
 */
export function tryCatchSync<T>(fn: () => T): [T, null] | [null, Error] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(getErrorMessage(error));
    return [null, err];
  }
}
