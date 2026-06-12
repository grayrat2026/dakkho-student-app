---
Task ID: 1
Agent: Main Agent
Task: Fix Instructor Site issues - Live Page, Course Creation, Curriculum modals, CourseDetail, VideoManager, Profile

Work Log:
- Read full codebase: CourseLive, CourseNew, CourseCurriculum, Profile, VideoManager, CourseDetail, CourseSettings
- Fixed CourseLive.tsx: Added missing AnimatePresence import that caused the Schedule Class dialog to crash
- Fixed CourseNew.tsx: Removed double `/instructor` prefix in apiUpload call for thumbnail (was `/instructor/instructor/courses/...`)
- Fixed CourseSettings.tsx: Same double-prefix bug in thumbnail upload
- Rewrote CourseCurriculum.tsx: Replaced cramped inline popups with proper fullscreen modals (Modal component) for Add Subject, Add Chapter, Edit Chapter, Add Lesson
- Fixed CourseDetail.tsx: Added safe defaults for course data (tags can be string or array, isPublished can be number or boolean), added error boundary with user-friendly error display
- Fixed VideoManager.tsx: Improved dialog alignment (max-w-xl, consistent padding, better sticky header)
- Fixed CourseLive.tsx: Consistent modal styling across all dialogs
- Improved CourseNew.tsx: Better courseId extraction from API response with fallback navigation

Stage Summary:
- All major bugs fixed and deployed
- Course creation with thumbnail upload now works (was broken due to double API path prefix)
- Live page dialog now works (was missing AnimatePresence import)
- Curriculum page has proper modals instead of cramped inline forms
- CourseDetail page no longer crashes on course data with mixed types
- VideoManager popup properly aligned
- Pushed to GitHub: grayrat2026/dakkho-instructor
- Deployed to Cloudflare Pages: https://dakkho-instructor.pages.dev/
---
Task ID: 1
Agent: Main Agent
Task: Fix Instructor Site - curriculum, live page, course creation, subject management, replace popups with pages

Work Log:
- Read all source code to understand current architecture
- Explored backend API endpoints to understand data structures
- Added new PageName types: course-subject, course-add-subject, course-add-video
- Updated store.ts with new route parsing and URL building for new pages
- Added new API hooks for thumbnail upload, lesson video upload, subject chapters
- Completely rebuilt CourseCurriculum.tsx - clean subject list with stats and drill-down
- Created CourseSubject.tsx - full subject detail with chapters, lessons, reviews/reply
- Created CourseAddSubject.tsx - proper grid selection page instead of popup
- Created CourseAddVideo.tsx - full page with upload/link/youtube/document tabs
- Rebuilt VideoManager.tsx as clean list page without popup
- Fixed CourseLive.tsx - proper data filtering, course sub-nav, empty states
- Fixed CourseNew.tsx - added error boundary, better error handling for thumbnail upload
- Updated InstructorApp.tsx with all new page components
- Fixed CourseDetail.tsx - tags.map crash when tags is string not array
- Fixed backend instructor.ts - removed non-existent instructor_id column from INSERT
- Fixed backend instructor.ts - changed course_subjects.instructor_id to course_instructors
- Fixed subject data mapping - use subjectName field, handle UUID subject IDs
- Built, deployed to Cloudflare Pages multiple times
- Committed and pushed to GitHub

Stage Summary:
- All popups replaced with proper separate pages
- Subject management now works: add, view, drill down
- Course creation works with error boundary
- Live page works properly
- Backend subject persistence fixed (instructor_id column issue)
- Tags crash fixed
- Site deployed at https://dakkho-instructor.pages.dev/
- Source code at https://github.com/grayrat2026/dakkho-instructor
