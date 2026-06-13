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
