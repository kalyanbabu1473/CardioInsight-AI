/**
 * Centralized API base URL configuration.
 *
 * The single source of truth for where the frontend talks to the CardioInsight
 * backend. Configure the backend origin with the `VITE_API_BASE_URL`
 * environment variable (the origin only — no trailing slash and no path):
 *
 *   - `frontend/.env`              → local backend (e.g. http://127.0.0.1:8000)
 *   - `frontend/.env.production`   → deployed backend (Render)
 *
 * The `/api` prefix is appended here, so all existing routes continue to
 * resolve as `/api/assessments`, `/api/assessments/latest`, `/api/predict`.
 *
 * When `VITE_API_BASE_URL` is unset it defaults to the relative `/api` path,
 * which the Vite dev server proxies to the local backend (see
 * `vite.config.ts`), so local development works out of the box without any
 * env file.
 */

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (!configured) return "/api";
  const origin = configured.replace(/\/+$/, "");
  if (origin.endsWith("/api")) return origin;
  return `${origin}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();
