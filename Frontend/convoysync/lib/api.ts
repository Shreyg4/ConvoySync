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
