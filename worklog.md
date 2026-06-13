---
Task ID: 1
Agent: Main Agent
Task: Fix instructor app curriculum page — add lesson attachment/PDF upload, video search by title, fix icon visibility + Fix student app Piprapay payment routing

Work Log:
- Read CourseSubject.tsx, CourseCurriculum.tsx, SubscriptionPage.tsx, PaymentResultPage.tsx
- Read worker API routes for videos/search and payments/create
- Read student app store.ts for page routing configuration

Instructor App Changes:
- Added attachment/note/PDF upload to CourseCurriculum.tsx lesson creation form
  - Added state: lessonDocument, lessonDocumentName, uploadingDocument, fileInputRef
  - Added document upload UI with drag/drop zone, file validation (50MB limit)
  - Added document upload logic in handleCreateLesson using apiUpload
  - Added document URL indicator (PDF badge) in lesson rows
- Added video search by title to CourseCurriculum.tsx lesson creation form
  - Added state: videoSearchQuery, videoSearchResults, searchingVideos, selectedExistingVideo, showVideoSearch
  - Added video search UI with search input, results list, video selection
  - Videos searchable across all instructor's courses via /videos/search API
  - Added selectedExistingVideo integration in handleCreateLesson
- Fixed chapter/lesson action icons visibility
  - Changed from opacity-0 group-hover:opacity-100 to opacity-40 group-hover:opacity-100
  - Icons now always visible with reduced opacity, full opacity on hover
  - Works on both desktop and touch/mobile devices
- Added imports: Upload, Search, Paperclip, File, Check from lucide-react
- Added import: apiGet, apiUpload from api-client
- Added import: useRef from react

Student App Changes:
- Added 'payment-result' and 'payment-cancel' to Page type union in store.ts
- Added 'payment-result': '/payment-result' and 'payment-cancel': '/payment-cancel' to pageToPath mapping
- Added PaymentCancelPage import to DakkhoApp.tsx
- Added 'payment-cancel': <PaymentCancelPage /> to pageMap in DakkhoApp.tsx
- This fixes PipraPay natural redirect flow: when payment completes, user is redirected to /payment-result?pp_id=xxx which is now properly routed

Deployments:
- Instructor app built and deployed to dakkho-instructor.pages.dev ✅
- Student app built and deployed to dakkho-student.pages.dev ✅

Stage Summary:
- Instructor curriculum page now has attachment/PDF upload, video search, and visible action icons
- Student app now properly routes PipraPay payment result and cancel pages
- Both apps pushed to GitHub (grayrat2026/dakkho-instructor-web, grayrat2026/dakkho-student-app)
