/**
 * Sentry Error Tracking Utilities
 * Helper functions for manual error reporting and user context
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Set user context for Sentry error tracking
 * Call this when user logs in to associate errors with specific users
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 * Call this when user logs out
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Manually capture an exception
 * Use this to report errors that you catch but want to track
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually capture a message
 * Use this for logging important events or warnings
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Add breadcrumb for debugging
 * Use this to track user actions or state changes
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    level: 'info',
  });
}

/**
 * Set custom context for errors
 * Use this to add additional data to all future error reports
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * Wrap a function with Sentry error tracking
 * Use this for important async operations
 */
export function withErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // Handle promises
      if (result instanceof Promise) {
        return result.catch((error) => {
          captureException(error, {
            operation: operationName,
            arguments: args,
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      captureException(error as Error, {
        operation: operationName,
        arguments: args,
      });
      throw error;
    }
  }) as T;
}

/**
 * Example usage in API routes or server components:
 *
 * import { captureException, addBreadcrumb } from '@/lib/sentry';
 *
 * try {
 *   addBreadcrumb('Fetching user data', 'api', { userId: '123' });
 *   const data = await fetchUserData();
 * } catch (error) {
 *   captureException(error, { userId: '123', endpoint: '/api/users' });
 * }
 */
