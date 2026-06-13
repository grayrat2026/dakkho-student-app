# Work Log — Instructor & Admin Site Fixes

---
Task ID: 1
Agent: Main Agent
Task: Fix instructor and admin site routing and page availability issues

Work Log:
- Investigated both apps' routing architecture (SPA with catch-all [...slug] routes)
- Instructor app: Missing trailingSlash in next.config.ts causing 404 on Cloudflare Pages refresh
- Instructor app: parsePath bug in store.ts (parts[4] should be parts[3] for schedule-live)
- Instructor app: pushState/replaceState not triggering page updates (only popstate was handled)
- Admin app: 3 missing pages (subjects, about, support) from generateStaticParams
- Admin app: Same pushState routing bug as instructor
- Admin app: Root page.tsx had outdated 12-entry pageComponents map
- Admin app: Build script was deleting _routes.json (breaking SPA routing on Cloudflare Pages)
- Admin app: support-panel.tsx had wrong auth token key, raw fetch instead of apiUpload, wrong attachment URL
- Instructor app: useDeleteVideo used wrong endpoint path (missing /courses/{id}/ prefix)
- Instructor app: useCreateVideo sent camelCase instead of snake_case to API
- Instructor app: useSubjectChapters ignored subjectId filter
- Instructor app: CourseDetail showed duration as "120h" instead of proper format

Stage Summary:
- All source code fixes applied and pushed to GitHub
- Both apps rebuilt and pushed to deployment repos
- Admin deployment repo: grayrat2026/dakkho-admin-web
- Instructor deployment repo: grayrat2026/dakkho-instructor-web
- Cloudflare Pages projects need manual reconfiguration to use new deployment repos

---
Task ID: 1
Agent: Main Agent
Task: Fix instructor site 404 on refresh + admin panel routing + admin pages

Work Log:
- Analyzed the root cause of 404 on refresh: Cloudflare Pages _worker.js was always serving root index.html instead of route-specific HTML
- Updated _worker.js in both admin and instructor apps to try serving route-specific HTML first (e.g., /courses/index.html for /courses), then fall back to root index.html
- Fixed admin AdminClientPage component to use URL pathname as source of truth instead of RSC data
- Added useState initialization from window.location.pathname and useEffect sync on mount
- Deployed both apps via wrangler pages deploy --branch=main for production deployment
- Tested all 26 admin pages with direct page loads - all working
- Tested all instructor pages with direct page loads - all working
- Updated GitHub repos with latest code

Stage Summary:
- Instructor site: All pages load correctly on refresh, no more 404s
- Admin panel: All 26 pages (dashboard, users, courses, videos, instructors, categories, subjects, technologies, institutes, institute-requests, coupons, discounts, payments, packages, enrollments, events, live-classes, support, achievements, push, notifications, config, email, analytics, settings, about) load correctly on direct page load
- Routing fix: _worker.js updated to serve route-specific HTML + client-side URL-based page detection
- Both apps deployed to production on Cloudflare Pages
---
Task ID: 1-9
Agent: Main Agent
Task: Fix routing, enhance CourseSettings, add video search + PDF upload to CourseSubject, add multi-tech subjects, build & deploy

Work Log:
- Fixed 404 on refresh for both instructor and admin apps by rewriting _worker.js to always fall back to index.html for SPA routing
- Created _routes.json for instructor app (was missing)
- Updated package.json build scripts to copy _routes.json from public/
- Enhanced CourseSettings page: added Course ID, creation date, last updated, price, language metadata section; added courseId fallback from URL; added "no course selected" empty state
- Enhanced CourseSubject page: added "Search My Uploaded Videos" feature that searches instructor's uploaded videos by title; added Attachment/PDF/Note upload with drag-and-drop UI; added document_url support in create/update lesson hooks; added PDF badge display on lesson rows
- Added `useSearchInstructorVideos` hook to api-hooks.ts
- Updated `useCreateLesson` and `useUpdateLesson` to support `documentUrl` field
- Added video search endpoint `GET /instructor/videos/search` to worker API
- Created `subject_technologies` junction table migration SQL and executed on D1
- Updated subjects API to support multi-technology: GET returns technology_ids/names, POST/PUT accept technology_ids array, added GET/POST/DELETE for /:subjectId/technologies
- Updated admin subjects-table.tsx: multi-select technology picker, display multiple technology badges, send technology_ids in save payload
- Built and deployed worker, instructor app, and admin app to Cloudflare
- Pushed all changes to GitHub

Stage Summary:
- Instructor 404 on refresh: FIXED ✅ (all routes return 200)
- Admin 404 on refresh: FIXED ✅ (all routes return 200)
- CourseSettings: Enhanced with metadata, no blank state ✅
- CourseSubject: Video search + PDF upload + attachment support ✅
- Multi-tech subjects: Junction table created, API updated, admin UI updated ✅
- All apps deployed and APIs verified working
- Worker: https://dakkho-admin-api.dakkho-admin.workers.dev
- Instructor: https://dakkho-instructor.pages.dev
- Admin: https://dakkho-admin.pages.dev
