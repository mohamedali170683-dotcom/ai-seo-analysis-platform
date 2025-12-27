/**
 * Shared API route utilities for consistent error handling and responses.
 *
 * Usage:
 * import { apiHandler, apiError, apiSuccess } from '@/lib/api/utils';
 *
 * export const GET = apiHandler(async (request) => {
 *   const data = await fetchData();
 *   return apiSuccess(data);
 * });
 */

import { NextResponse } from 'next/server';
import { getErrorMessage, AppError, toErrorResponse } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { HTTP_STATUS, PAGINATION } from '@/lib/constants';

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Create a success response
 */
export function apiSuccess<T>(data: T, status: number = HTTP_STATUS.OK): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}

/**
 * Create an error response
 */
export function apiError(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_ERROR,
  details?: unknown
): NextResponse {
  const body: { success: false; error: string; details?: unknown } = {
    success: false,
    error: message,
  };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Create a paginated success response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number }
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

// =============================================================================
// REQUEST HELPERS
// =============================================================================

/**
 * Parse JSON body safely
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<[T, null] | [null, NextResponse]> {
  try {
    const body = await request.json();
    return [body as T, null];
  } catch {
    return [null, apiError('Invalid JSON body', HTTP_STATUS.BAD_REQUEST)];
  }
}

/**
 * Get pagination parameters from URL
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    PAGINATION.MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION.DEFAULT_PAGE_SIZE), 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Get user ID from request (with fallback for demo)
 */
export function getUserId(searchParams: URLSearchParams): string {
  return searchParams.get('userId') || 'demo-user';
}

// =============================================================================
// ERROR HANDLER WRAPPER
// =============================================================================

/**
 * Route context type for Next.js 16+ (params is now a Promise)
 */
export type RouteContext<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T>;
};

/**
 * API handler type compatible with Next.js 16+ route handlers
 */
export type ApiHandler<T extends Record<string, string> = Record<string, string>> = (
  request: Request,
  context: RouteContext<T>
) => Promise<NextResponse>;

/**
 * Wrap an API handler with automatic error handling.
 *
 * @example
 * export const GET = apiHandler(async (request) => {
 *   const data = await prisma.user.findMany();
 *   return apiSuccess({ users: data });
 * });
 */
export function apiHandler<T extends Record<string, string> = Record<string, string>>(
  handler: ApiHandler<T>
): ApiHandler<T> {
  return async (request: Request, context: RouteContext<T>) => {
    const routeLogger = logger.forRoute(new URL(request.url).pathname);

    try {
      return await handler(request, context);
    } catch (error) {
      const message = getErrorMessage(error);
      routeLogger.error('API request failed', error instanceof Error ? error : undefined);

      // Handle known error types
      if (error instanceof AppError) {
        const { response, statusCode } = toErrorResponse(error);
        return NextResponse.json(response, { status: statusCode });
      }

      // Handle Prisma errors
      if (isPrismaError(error)) {
        return handlePrismaError(error);
      }

      // Generic error
      return apiError(message, HTTP_STATUS.INTERNAL_ERROR);
    }
  };
}

// =============================================================================
// PRISMA ERROR HANDLING
// =============================================================================

interface PrismaError {
  code?: string;
  meta?: { target?: string[] };
}

function isPrismaError(error: unknown): error is PrismaError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string'
  );
}

function handlePrismaError(error: PrismaError): NextResponse {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const fields = error.meta?.target?.join(', ') || 'field';
      return apiError(
        `A record with this ${fields} already exists`,
        HTTP_STATUS.BAD_REQUEST
      );

    case 'P2025':
      // Record not found
      return apiError('Record not found', HTTP_STATUS.NOT_FOUND);

    case 'P2003':
      // Foreign key constraint failed
      return apiError(
        'Referenced record does not exist',
        HTTP_STATUS.BAD_REQUEST
      );

    default:
      return apiError('Database error', HTTP_STATUS.INTERNAL_ERROR);
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate required fields in request body
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}

/**
 * Validate ID parameter format (UUID or CUID)
 */
export function isValidId(id: string): boolean {
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // CUID format (Prisma default)
  const cuidRegex = /^c[a-z0-9]{24}$/;

  return uuidRegex.test(id) || cuidRegex.test(id);
}
