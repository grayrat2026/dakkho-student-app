# DAKKHO Admin API Client

## Overview

`@/lib/api-client` provides a unified interface for making API requests from the DAKKHO Admin frontend. It automatically detects the runtime environment and routes requests to either:

- **Supabase Edge Functions** — when `NEXT_PUBLIC_API_BASE_URL` is set in `.env`
- **Local Next.js API routes** — the default, routing to `/api/admin/...`

No code changes are needed to switch between environments — just set or unset the environment variable.

---

## Quick Start

```ts
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '@/lib/api-client';
```

### GET

```ts
// Before (inline fetch)
const res = await fetch('/api/admin/users?limit=20');
if (res.ok) { const data = await res.json(); }

// After (api-client)
const data = await apiGet('/users?limit=20');
```

### POST

```ts
// Before
const res = await fetch('/api/admin/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// After
const data = await apiPost('/auth', { email, password });
```

### PUT

```ts
// Before
const res = await fetch('/api/admin/users', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, isActive: true }),
});

// After
const data = await apiPut('/users', { userId, isActive: true });
```

### DELETE

```ts
// Before
const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });

// After
const data = await apiDelete(`/users?id=${userId}`);
```

### File Upload

```ts
const fd = new FormData();
fd.append('file', fileInput.files[0]);
fd.append('courseId', 'abc');
const result = await apiUpload('/videos/upload', fd);
```

---

## API Reference

### `apiGet<T>(path: string): Promise<T>`

Perform a GET request. Path is relative to `/api/admin/`.

### `apiPost<T>(path: string, body: unknown): Promise<T>`

Perform a POST request with a JSON body.

### `apiPut<T>(path: string, body: unknown): Promise<T>`

Perform a PUT request with a JSON body.

### `apiDelete<T>(path: string): Promise<T>`

Perform a DELETE request. Query params (like `?id=xxx`) go in the path string.

### `apiUpload<T>(path: string, formData: FormData): Promise<T>`

Upload files via `multipart/form-data`. The `Content-Type` header is automatically set by the browser with the correct boundary — do not set it manually.

### `apiRaw(path: string, init?: RequestInit): Promise<Response>`

Returns the raw `Response` object for advanced use cases (streaming, reading headers, manual error handling).

---

## Error Handling

All methods throw an `ApiError` on non-2xx responses:

```ts
import { ApiError } from '@/lib/api-client';

try {
  const data = await apiGet('/users?limit=20');
} catch (err) {
  if (err instanceof ApiError) {
    console.error(`Status: ${err.status}, Code: ${err.code}, Message: ${err.message}`);
    // err.details contains the full error response body
  }
}
```

### ApiError Properties

| Property  | Type     | Description                          |
|-----------|----------|--------------------------------------|
| `status`  | `number` | HTTP status code (e.g. 400, 401, 500)|
| `code`    | `string` | Error code from server or status     |
| `message` | `string` | Human-readable error message         |
| `details` | `unknown`| Full error response body (if any)    |

---

## Authentication

### Local Mode (Next.js API Routes)

No special auth headers are needed. Authentication is handled server-side via session cookies or middleware.

### Supabase Edge Functions Mode

When `NEXT_PUBLIC_API_BASE_URL` is set, the client automatically:

1. Reads the auth token from `localStorage` (key: `dakkho_admin_token`)
2. Sends it as `Authorization: Bearer <token>` header
3. Sends `apikey` header with `NEXT_PUBLIC_SUPABASE_ANON_KEY` for RLS-protected functions

#### Setting the Token After Login

```ts
import { setAuthToken } from '@/lib/api-client';

// In your login handler, after successful auth:
const data = await apiPost('/auth', { email, password });
setAuthToken(data.token); // Store the token returned by the edge function
```

#### Clearing the Token on Logout

```ts
import { clearAuthToken } from '@/lib/api-client';

clearAuthToken();
```

---

## Environment Configuration

### Local Mode (Default)

No configuration needed. Requests go to `/api/admin/...` on the same origin.

### Supabase Edge Functions Mode

Add these environment variables to `.env.local`:

```env
# Required — activates Supabase Edge Functions routing
NEXT_PUBLIC_API_BASE_URL=https://your-project.supabase.co

# Required — Supabase anon key for RLS and function access
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

When `NEXT_PUBLIC_API_BASE_URL` is set, request paths are mapped:

```
/api/admin/users?limit=20
→ https://your-project.supabase.co/functions/v1/users?limit=20
```

---

## Path Mapping Reference

All paths passed to the API client functions are **relative to `/api/admin/`** — just pass the suffix.

| Component              | Old Inline Fetch                            | New api-client Call          |
|------------------------|---------------------------------------------|------------------------------|
| **Dashboard**          | `fetch('/api/admin/analytics')`             | `apiGet('/analytics')`       |
| **Users Table**        | `fetch('/api/admin/users?…')`               | `apiGet('/users?…')`         |
| **Users — Update**     | `fetch('/api/admin/users', {method:'PUT'})` | `apiPut('/users', body)`     |
| **Users — Delete**     | `fetch('/api/admin/users?id=x', {DEL})`     | `apiDelete('/users?id=x')`   |
| **Categories**         | `fetch('/api/admin/categories?…')`          | `apiGet('/categories?…')`    |
| **Categories — Save**  | `fetch('/api/admin/categories', {POST/PUT})`| `apiPost/Put('/categories', body)` |
| **Categories — Delete**| `fetch('/api/admin/categories?id=x', {DEL})`| `apiDelete('/categories?id=x')`|
| **Courses**            | `fetch('/api/admin/courses?…')`             | `apiGet('/courses?…')`       |
| **Courses — Save**     | `fetch('/api/admin/courses', {POST/PUT})`   | `apiPost/Put('/courses', body)` |
| **Courses — Delete**   | `fetch('/api/admin/courses?id=x', {DEL})`   | `apiDelete('/courses?id=x')` |
| **Videos**             | `fetch('/api/admin/videos?…')`              | `apiGet('/videos?…')`        |
| **Videos — Save**      | `fetch('/api/admin/videos', {POST/PUT})`    | `apiPost/Put('/videos', body)` |
| **Videos — Delete**    | `fetch('/api/admin/videos?id=x', {DEL})`    | `apiDelete('/videos?id=x')`  |
| **Instructors**        | `fetch('/api/admin/instructors?…')`         | `apiGet('/instructors?…')`   |
| **Instructors — Save** | `fetch('/api/admin/instructors', {POST/PUT})`| `apiPost/Put('/instructors', body)` |
| **Instructors — Delete**| `fetch('/api/admin/instructors?id=x', {DEL})`| `apiDelete('/instructors?id=x')` |
| **Institutes**         | `fetch('/api/admin/institutes?…')`          | `apiGet('/institutes?…')`    |
| **Institutes — Save**  | `fetch('/api/admin/institutes', {POST/PUT})`| `apiPost/Put('/institutes', body)` |
| **Institutes — Delete**| `fetch('/api/admin/institutes?id=x', {DEL})`| `apiDelete('/institutes?id=x')` |
| **Notifications**      | `fetch('/api/admin/notifications?…')`       | `apiGet('/notifications?…')` |
| **Notifications — Send**| `fetch('/api/admin/notifications', {POST})`| `apiPost('/notifications', body)` |
| **Config**             | `fetch('/api/admin/config')`                | `apiGet('/config')`          |
| **Config — Save**      | `fetch('/api/admin/config', {PUT})`         | `apiPut('/config', config)`  |
| **System Status**      | `fetch('/api/admin/system/status')`         | `apiGet('/system/status')`   |
| **API Key**            | `fetch('/api/admin/system/api-key', {POST})`| `apiPost('/system/api-key', body)` |
| **Email — Test**       | `fetch('/api/admin/email/test', {POST})`    | `apiPost('/email/test', body)`|
| **Login**              | `fetch('/api/admin/auth', {POST})`          | `apiPost('/auth', body)`     |

---

## Migration Guide: Component-by-Component

### General Pattern

Replace each inline `fetch()` call with the corresponding api-client function. The path should strip `/api/admin/` — only the suffix is needed.

#### Before (inline fetch with manual error handling)

```tsx
try {
  const res = await fetch('/api/admin/users?limit=20');
  if (res.ok) {
    const data = await res.json();
    setUsers(data.documents || []);
  }
} catch {
  toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
}
```

#### After (using api-client)

```tsx
import { apiGet, ApiError } from '@/lib/api-client';

try {
  const data = await apiGet('/users?limit=20');
  setUsers(data.documents || []);
} catch (err) {
  if (err instanceof ApiError) {
    toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
}
```

#### Before (POST/PUT with JSON body)

```tsx
const res = await fetch('/api/admin/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
if (res.ok) {
  toast({ title: 'Success' });
}
```

#### After

```tsx
import { apiPost, ApiError } from '@/lib/api-client';

try {
  await apiPost('/categories', payload);
  toast({ title: 'Success' });
} catch (err) {
  if (err instanceof ApiError) {
    toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
}
```

### Per-Component Migration Checklist

- [ ] `login-form.tsx` — Replace `fetch('/api/admin/auth', {POST})` → `apiPost('/auth', body)`
- [ ] `dashboard.tsx` — Replace `fetch('/api/admin/analytics')` → `apiGet('/analytics')`
- [ ] `analytics-panel.tsx` — Replace `fetch('/api/admin/analytics')` → `apiGet('/analytics')`
- [ ] `users-table.tsx` — Replace 3 fetch calls (GET, PUT, DELETE)
- [ ] `courses-table.tsx` — Replace 4 fetch calls (GET, POST, PUT, DELETE)
- [ ] `videos-table.tsx` — Replace 4 fetch calls (GET, POST, PUT, DELETE)
- [ ] `instructors-table.tsx` — Replace 4 fetch calls (GET, POST, PUT, DELETE)
- [ ] `categories-table.tsx` — Replace 4 fetch calls (GET, POST, PUT, DELETE)
- [ ] `institutes-table.tsx` — Replace 4 fetch calls (GET, POST, PUT, DELETE)
- [ ] `notifications-panel.tsx` — Replace 2 fetch calls (GET, POST)
- [ ] `config-panel.tsx` — Replace 2 fetch calls (GET, PUT)
- [ ] `settings-panel.tsx` — Replace 2 fetch calls (GET, POST)
- [ ] `email-panel.tsx` — Replace 2 fetch calls (POST, POST)

---

## Supabase Edge Function Naming Convention

When running in Supabase mode, each API path segment maps to an Edge Function name. The mapping follows these rules:

| API Path Suffix             | Edge Function Name    |
|-----------------------------|-----------------------|
| `/analytics`                | `analytics`           |
| `/users`                    | `users`               |
| `/courses`                  | `courses`             |
| `/videos`                   | `videos`              |
| `/instructors`              | `instructors`         |
| `/categories`               | `categories`          |
| `/institutes`               | `institutes`          |
| `/notifications`            | `notifications`       |
| `/config`                   | `config`              |
| `/auth`                     | `auth`                |
| `/system/status`            | `system-status`       |
| `/system/api-key`           | `system-api-key`      |
| `/email/test`               | `email-test`          |

> **Note:** Supabase Edge Function names use hyphens instead of slashes. The client handles the path-to-function mapping automatically.

---

## TypeScript Usage

All functions accept a generic type parameter for typed responses:

```ts
import { apiGet } from '@/lib/api-client';
import { ServerConfig } from '@/lib/types';

const config = await apiGet<ServerConfig>('/config');
//    ^? ServerConfig — fully typed
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           DAKKHO Admin Frontend             │
│                                             │
│   Component calls:                          │
│   apiGet('/users?limit=20')                 │
│   apiPost('/auth', { email, password })     │
│   apiPut('/config', config)                 │
│   apiDelete('/courses?id=abc')              │
│   apiUpload('/videos/upload', formData)     │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │         api-client.ts               │   │
│   │                                     │   │
│   │  NEXT_PUBLIC_API_BASE_URL set?      │   │
│   │       ┌─ YES ─┐    ┌─ NO ──┐       │   │
│   │       │        │    │       │       │   │
│   │  Supabase    Local   │       │   │
│   │  Edge Fn     Next.js │       │   │
│   │       │        │    │       │       │   │
│   └───────┼────────┼────┼───────┼───────┘   │
│           │        │    │       │            │
└───────────┼────────┼────┼───────┼────────────┘
            │        │    │       │
            ▼        │    ▼       │
  Supabase Edge      │  /api/    │
  Functions           │  admin/*  │
  (with Bearer        │  routes   │
   token + apikey)    │           │
                      ▼           ▼
                Next.js API Route Handlers
                (server-side logic)
```
