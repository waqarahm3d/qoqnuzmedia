/**
 * Standardized API Response Utilities
 * Ensures all API responses return proper JSON
 */

import { NextResponse } from 'next/server';

/**
 * Success response with data
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Error response with message
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: any
) {
  const errorResponse: any = {
    error: message,
    success: false,
  };

  if (details && process.env.NODE_ENV !== 'production') {
    errorResponse.details = details;
  }

  console.error(`[API Error ${status}]:`, message, details || '');

  return NextResponse.json(errorResponse, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Validation error (400)
 */
export function apiValidationError(message: string, fields?: any) {
  return apiError(message, 400, fields);
}

/**
 * Unauthorized error (401)
 */
export function apiUnauthorized(message: string = 'Unauthorized') {
  return apiError(message, 401);
}

/**
 * Forbidden error (403)
 */
export function apiForbidden(message: string = 'Forbidden') {
  return apiError(message, 403);
}

/**
 * Not found error (404)
 */
export function apiNotFound(message: string = 'Not found') {
  return apiError(message, 404);
}

/**
 * Server error (500)
 */
export function apiServerError(message: string = 'Internal server error', error?: any) {
  return apiError(message, 500, error?.message || error);
}

/**
 * Wrap async API handler with automatic error handling
 */
export function withErrorHandling(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error('[API Handler Error]:', error);

      // Database errors
      if (error.code) {
        switch (error.code) {
          case '23505': // Unique violation
            return apiError('A record with this value already exists', 409, error.message);
          case '23503': // Foreign key violation
            return apiError('Referenced record not found', 400, error.message);
          case '23502': // Not null violation
            return apiError('Required field is missing', 400, error.message);
          case 'PGRST116': // Row not found
            return apiNotFound('Record not found');
          default:
            return apiServerError('Database error', error);
        }
      }

      // JSON parse errors
      if (error instanceof SyntaxError) {
        return apiValidationError('Invalid JSON in request body');
      }

      // Default error
      return apiServerError(
        error.message || 'An unexpected error occurred',
        error
      );
    }
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
  body: any,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!body[field]) {
      return `${field} is required`;
    }
  }
  return null;
}
