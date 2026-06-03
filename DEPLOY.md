# DAKKHO Admin — Deployment Guide

## Current Status (2026-06-04)

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://grayrat2026.github.io/dakkho-admin/ | ✅ Deployed & Working |
| API | https://dakkho-admin-api.dakkho-admin.workers.dev/ | ⚠️ Needs redeployment with fixes |
| Appwrite | https://sgp.cloud.appwrite.io/v1 | ✅ Connected |
| R2 Storage | 4 buckets (videos, thumbnails, avatars, resources) | ✅ Connected |

## What's Fixed (in code, needs deployment)

1. **Auth Bug**: Worker was sending `X-Appwrite-Key` + `Cookie` together, causing 401. Now sends API key OR session cookie, never both.
2. **D1 SQL**: Health check used reserved keyword `check`, changed to `ok`.
3. **Frontend API**: All 30+ `fetch('/api/admin/...')` calls replaced with `apiGet/apiPost/apiPut/apiDelete` helpers that correctly route to Cloudflare Workers.
4. **Logo Path**: Now uses `assetUrl()` helper for basePath-aware image URLs.
5. **Auth Flow**: Login uses `POST /auth/login`, check uses `POST /auth/check`, logout uses `DELETE /auth/logout`.

## 🚀 Deploy the Worker (REQUIRED)

### Step 1: Create Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **Custom Token** → Name it "DAKKHO Admin Deploy"
4. Set permissions:
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **D1** → **Edit**
   - **Account** → **Workers KV Storage** → **Edit**
   - **Account** → **Cloudflare Pages** → **Edit**
   - **User** → **User Details** → **Read**
5. Click **Continue to summary** → **Create Token**
6. Copy the token value

### Step 2: Deploy

```bash
# Set the token
export CLOUDFLARE_API_TOKEN="your-new-token-here"

# Navigate to worker directory
cd worker

# Initialize D1 schema (creates tables)
npx wrangler d1 execute dakkho-admin-db --remote --file=./schema.sql

# Set secrets
echo "standard_c465097b57e28bd7eed617fae6e488b82587b8474d66def111cf4693351e3c89b558bf391bee4aa87dccb718d9d03a69a7257dbd59696c8f164aa5b4b44fc987b374bd8532429dccd318bbc1e15e683eaf429e57e04f2f5fbd8f1fc522e67494dcf855901261f4a4cd709c90a20fd407df4fc5826b807cf9d4b42e4478684c28" | npx wrangler secret put APPWRITE_API_KEY
echo "re_YBYgjXfu_JAQbAR51HADxWUUpPEBKgdG2" | npx wrangler secret put RESEND_API_KEY
echo "dakkho-admin-secret-2024" | npx wrangler secret put ADMIN_SECRET_KEY

# Deploy worker
npx wrangler deploy
```

OR use the automated script:

```bash
export CLOUDFLARE_API_TOKEN="your-new-token-here"
cd worker
bash deploy.sh
```

### Step 3: Verify

```bash
# Health check
curl https://dakkho-admin-api.dakkho-admin.workers.dev/

# System status - ALL should be "connected"
curl https://dakkho-admin-api.dakkho-admin.workers.dev/admin/system/status

# Login test
curl -X POST https://dakkho-admin-api.dakkho-admin.workers.dev/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"himadrient@proton.me","password":"Sr5051380@"}'
```

## ☁️ Deploy to Cloudflare Pages (Optional)

If you want to use Cloudflare Pages instead of GitHub Pages:

```bash
# Build the frontend
cd /home/z/my-project
bash scripts/build-for-pages.sh

# Deploy to Cloudflare Pages
export CLOUDFLARE_API_TOKEN="your-token"
npx wrangler pages project create dakkho-admin --production-branch=main
npx wrangler pages deploy out --project-name=dakkho-admin
```

Then update the CORS origin in `worker/src/index.ts` to include the new Pages URL.

## 🔧 GitHub Actions Auto-Deploy

The workflow `.github/workflows/deploy.yml` will automatically:
1. Build and deploy the frontend to GitHub Pages on every push to `main`
2. Deploy the worker to Cloudflare (requires `CLOUDFLARE_API_TOKEN` secret)

To set the GitHub secret:
1. Go to https://github.com/grayrat2026/dakkho-admin/settings/secrets/actions
2. Add `CLOUDFLARE_API_TOKEN` with your new token value
3. Also add `APPWRITE_API_KEY` and `RESEND_API_KEY` secrets

## Files Changed

| File | Change |
|------|--------|
| `worker/src/lib/appwrite.ts` | Fix: Don't send X-Appwrite-Key with session cookie requests |
| `worker/src/routes/system.ts` | Fix: D1 SQL reserved keyword `check` → `ok` |
| `src/app/page.tsx` | Fix: Use apiPost for auth check, assetUrl for logo |
| `src/components/admin/login-form.tsx` | Fix: Use apiPost('/auth/login'), setAuthToken |
| `src/components/admin/header.tsx` | Fix: Use apiDelete('/auth/logout'), clearAuthToken |
| `src/components/admin/sidebar.tsx` | Fix: Use assetUrl for logo |
| `src/components/admin/dashboard.tsx` | Fix: Use apiGet |
| `src/components/admin/users-table.tsx` | Fix: Use apiGet/apiPut/apiDelete |
| `src/components/admin/categories-table.tsx` | Fix: Use apiGet/apiPost/apiPut/apiDelete |
| `src/components/admin/courses-table.tsx` | Fix: Use apiGet/apiPost/apiPut/apiDelete |
| `src/components/admin/videos-table.tsx` | Fix: Use apiGet/apiPost/apiPut/apiDelete |
| `src/components/admin/instructors-table.tsx` | Fix: Use apiGet/apiPost/apiPut/apiDelete |
| `src/components/admin/institutes-table.tsx` | Fix: Use apiGet/apiPost/apiPut/apiDelete |
| `src/components/admin/notifications-panel.tsx` | Fix: Use apiGet/apiPost |
| `src/components/admin/config-panel.tsx` | Fix: Use apiGet/apiPut |
| `src/components/admin/analytics-panel.tsx` | Fix: Use apiGet |
| `src/components/admin/settings-panel.tsx` | Fix: Use apiGet/apiPost |
| `src/components/admin/email-panel.tsx` | Fix: Use apiPost |
| `src/lib/api-client.ts` | Add: assetUrl helper, BASE_PATH support |
| `src/app/layout.tsx` | Fix: Use assetUrl for favicon |
| `next.config.github-pages.ts` | Add: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_BASE_PATH |
| `next.config.cloudflare-pages.ts` | New: Cloudflare Pages config (no basePath) |
| `.github/workflows/deploy.yml` | Update: Worker deployment job |
| `scripts/build-for-pages.sh` | Update: API URL env var |
| `worker/deploy.sh` | New: Automated deployment script |
