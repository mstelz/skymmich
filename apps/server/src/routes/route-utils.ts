import type { Context } from 'hono';

/**
 * Shared error handler for route catch blocks.
 * Logs the error and returns a structured JSON response.
 */
export function handleRouteError(c: Context, error: unknown, context: string): Response {
  const err = error as Error & { response?: { data?: { message?: string }; status?: number }; code?: string };
  console.error(`${context}:`, err.response?.data || err.message || err);

  // If the upstream service returned an error (e.g. axios), forward its status
  if (err.response?.status && err.response.status >= 400 && err.response.status < 600) {
    return c.json(
      { message: err.response.data?.message || context },
      err.response.status as 400,
    );
  }

  return c.json({ message: context }, 500);
}
