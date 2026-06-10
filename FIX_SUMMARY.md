# DAKKHO Fix Summary — 2026-06-10

## Changes Made (committed & pushed to GitHub)

### 1. Student App — Fixed topBarElements Crash
- **Root cause**: Worker API `/api/config` returned flat structure `{featureToggles, homePageSections, ...}` but Student App expected nested `{contentProtection, features, ui: {homeSections, topBarElements, ...}}`
- **Fix in Worker** (`worker/src/routes/student-api.ts`): `transformConfigForStudent()` now nests UI fields under `ui` key and renames `featureToggles` → `features`
- **Fix in Student App** (`dakkho-student-app/src/lib/store.ts`): All `isXVisible()` methods now use optional chaining (`config?.ui?.topBarElements`) with fallback to DEFAULT_CONFIG. `fetchConfig()` now deep-merges API response with defaults.

### 2. Student App — Fixed Font 404 Errors
- **Root cause**: `globals.css` had 5 `@font-face` blocks all pointing to the same wrong URL for Nunito font weights
- **Fix**: Removed all `@font-face` blocks — Google Fonts `<link>` in layout.tsx already loads all weights correctly

### 3. Student App — Fixed SPA Routing (pages 404 on refresh)
- **Root cause**: Conflicting `_worker.js` + `_routes.json` overriding `_redirects`; `_routes.json` routing ALL traffic through worker; `404.html` was Next.js default 404, not the SPA
- **Fix**: Removed `_worker.js` and `_routes.json`, kept `_redirects` (`/* /index.html 200`), build script now copies `index.html` → `404.html`
- **Also**: Disabled conflicting `wrangler.jsonc` and `open-next.config.ts` (for static export, not SSR)

### 4. Admin App — Fixed Data Not Displaying
- **Root cause**: Worker API returns `{ documents: [...], total }` for list endpoints, but all Admin components looked for specific keys like `{ courses: [...] }`, `{ instructors: [...] }`, etc.
- **Fix**: All 14+ Admin components now check `data.documents` first as primary, with specific key as fallback

### 5. D1 Schema — Added Migration Endpoint
- **Root cause**: `categories` table missing `parent_id` column, possibly other tables missing columns too
- **Fix**: Added `/admin/migrate` endpoint to Worker that:
  - Creates all 32 tables (IF NOT EXISTS)
  - ALTERs existing tables to add missing columns (ignores "already exists" errors)
  - Creates all indexes (IF NOT EXISTS)
  - Seeds default data (INSERT OR IGNORE)
  - GET endpoint to check current schema status

## What Still Needs to Be Done (requires Cloudflare access)

### ⚠️ WORKER DEPLOYMENT NEEDED
The Worker code has been updated but NOT yet deployed. You need to deploy it:
```bash
cd worker
wrangler login   # or set CLOUDFLARE_API_TOKEN
wrangler deploy --config wrangler.toml
```

### ⚠️ D1 MIGRATION NEEDED (after Worker is deployed)
After deploying the Worker, run the migration to add missing columns/tables:
```bash
# Option A: Via API (after Worker is deployed)
curl -X POST https://dakkho-admin-api.dakkho-admin.workers.dev/admin/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Option B: Via Wrangler CLI
cd worker
wrangler d1 execute dakkho-admin-db --remote --file=schema.sql
```

### ⚠️ STUDENT APP DEPLOYMENT
If Cloudflare Pages auto-deploys from GitHub, it should pick up the changes automatically.
If not, you need to manually deploy:
```bash
cd dakkho-student-app
npm run build
npx wrangler pages deploy out/ --project-name=dakkho-student
```

### ⚠️ ADMIN APP DEPLOYMENT
If Cloudflare Pages auto-deploys from GitHub, it should pick up the changes automatically.
If not:
```bash
cd /home/z/my-project
npm run build
npx wrangler pages deploy out/ --project-name=dakkho-admin
```

### ⚠️ CLEAR KV CACHE
After running migration, clear the KV config cache so the new config format is served:
```bash
wrangler kv key delete --namespace-id=f61a482ba88a45bebb35dfd600cd742d --key=server_config
```
