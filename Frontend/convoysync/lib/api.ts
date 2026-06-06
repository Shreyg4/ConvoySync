import { authHeader } from './oauth';

// Central place for the backend base URL.
// Set EXPO_PUBLIC_API_URL in .env (e.g. your Render URL or a dev tunnel).
// Falls back to localhost for web/simulator use.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

// Helper to build a full endpoint URL: apiUrl('/auth/login') -> `${API_URL}/auth/login`
export function apiUrl(path: string): string {
  const base = API_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

// Error thrown by apiFetch when the server responds with a non-2xx status.
// `status` lets callers special-case things like 401 (expired session) or
// 409 (conflict); `message` is the server's `error` string when available.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  // Plain object — apiFetch JSON-stringifies it and sets the Content-Type.
  body?: unknown;
  // Attach the stored JWT (default true). Set false for login/signup.
  auth?: boolean;
};

/**
 * One place for every backend call. It:
 *  - builds the full URL,
 *  - attaches the auth header (unless `auth: false`),
 *  - JSON-encodes the body and sets Content-Type,
 *  - parses the JSON response,
 *  - throws an `ApiError(message, status)` on any non-2xx response.
 *
 * Callers wrap it in try/catch and show the message to the user, instead of the
 * old pattern of `console.log(...)` + silent `return`.
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) Object.assign(headers, await authHeader());

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Parse the body defensively — some responses may be empty.
  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.error) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}
