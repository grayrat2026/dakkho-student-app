---
Task ID: 1
Agent: Main Agent
Task: Update GitHub repos with latest source, build, and worker code

Work Log:
- Built admin app from root directory (npx next build)
- Synced admin build output to repos/dakkho-admin-web/ and force pushed to dakkho-admin-web.git
- Resolved merge conflicts in instructor-app (constants.ts, Schedule.tsx) and pushed to dakkho-instructor.git
- Synced student-app source from student-app/ to repos/dakkho-student-app/ and pushed to dakkho-student-app.git
- Synced worker source from worker/ to dakkho-worker-fresh/ and force pushed to dakkho-worker.git
- Built student app from student-app/ directory (npx next build)
- Deployed correct student app build to dakkho-student Cloudflare Pages project

Stage Summary:
- All 4 GitHub repos updated: dakkho-admin-web, dakkho-instructor, dakkho-student-app, dakkho-worker
- Student app correctly deployed to dakkho-student.pages.dev (was previously wrong - had admin build)
- Build verification: Admin (26 pages), Instructor (builds), Student (14 pages), Worker (deployed)
