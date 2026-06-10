---
Task ID: 1
Agent: Main
Task: Add Curriculum Structure (Subject → Chapter → Lesson → Video) to Dakkho Platform

Work Log:
- Explored entire codebase: D1 schema, Worker API routes, Admin Panel, Student App
- Discovered actual D1 schema differs from schema.sql (migration-based with extra columns)
- Created migration-curriculum.sql with new tables: chapters, lessons, course_learning_points
- Added columns to videos: lesson_id, lesson_type (subject_id and chapter_id already existed)
- Added columns to courses: semester, what_you_learn
- Ran migration on remote D1 successfully
- Created 3 new Worker API route files: chapters.ts, lessons.ts, learning-points.ts
- Updated student-api.ts: new GET /courses/:id/curriculum endpoint, updated GET /courses/:id with learningPoints and subjects
- Updated videos.ts: added lesson_id, lesson_type to allowedFields
- Updated courses.ts: added semester, what_you_learn to allowedFields, added learning_points array handling
- Updated worker index.ts: mounted new routes under /admin/chapters, /admin/lessons, /admin/learning-points
- Updated Admin Panel courses-table.tsx: added "What You'll Learn" editing, Semester dropdown, Technology select, "Manage Curriculum" button
- Created Admin Panel course-curriculum.tsx: full curriculum management component with chapters/lessons/learning points CRUD
- Updated Student App api-client.ts: new types (Chapter, Lesson, LearningPoint), new mappers, updated Course/Video types, new courseApi.curriculum() method
- Updated Student App store.ts: deep URL routing for course detail tabs (/course/detail/{id}/overview, /curriculum, /reviews, /instructor)
- Updated Student App CourseDetailPage.tsx: tab sync with URL, "What You'll Learn" from API, curriculum tab with Subject→Chapter→Lesson→Video hierarchy, lesson type badges, legacy fallback
- Built all 3 apps successfully
- Deployed Worker, Admin Panel, Student App to Cloudflare
- Pushed to GitHub: dakkho-student-app, dakkho-admin-web, dakkho-worker

Stage Summary:
- D1 now has chapters, lessons, course_learning_points tables + new columns on videos and courses
- Worker API has 3 new admin CRUD endpoints + 1 new public curriculum endpoint
- Admin Panel can manage curriculum (chapters, lessons, learning points) per course
- Student App shows curriculum hierarchy with lesson type badges and deep URL routing
- All deployed and API verified working
