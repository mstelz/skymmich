import type { Response } from 'express';

/**
 * Shared error handler for route catch blocks.
 * Logs the error and returns a structured JSON response.
 */
export function handleRouteError(res: Response, error: unknown, context: string): void {
  const err = error as Error & { response?: { data?: { message?: string }; status?: number }; code?: string };
  console.error(`${context}:`, err.response?.data || err.message || err);

  // If the upstream service returned an error (e.g. axios), forward its status
  if (err.response?.status && err.response.status >= 400 && err.response.status < 600) {
    res.status(err.response.status).json({
      message: err.response.data?.message || context,
    });
    return;
  }

  res.status(500).json({ message: context });
}
