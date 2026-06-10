/**
 * Utility functions for DAKKHO Admin API
 */

import { Context } from 'hono';

/**
 * Generate a unique ID (UUID v4-like)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Standard JSON response helper
 */
export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Parse JSON body safely
 */
export async function parseBody<T = Record<string, unknown>>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

/**
 * Format date for D1 storage (ISO 8601)
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Calculate session expiry date (7 days from now)
 */
export function getSessionExpiry(days: number = 7): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

/**
 * Convert a camelCase string to snake_case.
 * e.g. "thumbnailUrl" → "thumbnail_url", "isPublished" → "is_published"
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Normalize an object's keys from camelCase to snake_case.
 * This allows the admin panel (which sends camelCase) to work with
 * D1 column names (which are snake_case).
 * Only transforms keys that exist in the provided `allowedFields` set.
 */
export function normalizeKeys(
  data: Record<string, unknown>,
  allowedFields: string[]
): Record<string, unknown> {
  const allowedSet = new Set(allowedFields);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const snakeKey = camelToSnake(key);
    // Use the snake_case key if it's in allowedFields; otherwise try original key
    if (allowedSet.has(snakeKey)) {
      result[snakeKey] = value;
    } else if (allowedSet.has(key)) {
      result[key] = value;
    }
    // Skip keys that don't match any allowed field (camelCase or snake_case)
  }

  return result;
}
