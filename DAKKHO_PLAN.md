# 🎯 DAKKHO Development Master Plan

**Last Updated:** 2026-06-08  
**Project:** DAKKHO - Educational Platform (Admin + Student Panels)  
**Stack:** Hono 4 (Cloudflare Workers) | Appwrite | D1 | R2 | Next.js (Static SPA) | PipraPay | Resend

---

## 📋 Task Progress Overview

| # | Task | Phase | Status | Repos |
|---|------|-------|--------|-------|
| 0 | User Profile Data Persist Fix | 1 | 🟢 DONE | Student Web, Worker API |
| 1 | Header/TopBar Items Hide Fix | 1 | 🟢 DONE | Student Web |
| 2 | Real Reviews (Replace Mock) | 2 | 🟢 DONE | Student Web, Worker API |
| 3 | Instructor Stats Fix | 2 | 🟢 DONE | Worker API |
| 4 | My-Courses: Show Enrolled Only | 2 | 🟢 DONE | Student Web, Worker API |
| 5 | Enroll → Payment Page Flow | 1 | 🟢 DONE | Student Web, Worker API |
| 6 | "What You'll Learn" (Admin Select+Search+Text) | 3 | 🟢 DONE | Admin Web, Worker API, Student Web |
| 7 | PDF/Images Optional Resources per Lesson | 3 | 🟢 DONE | Admin Web, Worker API, Student Web |
| 8 | Book System (PDF/Physical, Delivery, Pricing, Reader) | 4 | 🟢 DONE | Admin Web, Worker API, Student Web |
| 9 | Signup OTP Before DB Store | 1 | 🟢 DONE | Worker API |
| 10 | Reset Password OTP via Email | 1 | 🟢 DONE | Worker API, Student Web |

**Status Legend:** 🔴 TODO | 🟡 IN PROGRESS | 🟢 DONE | ⚠️ BLOCKED

---

## Execution Order

### Phase 1 (Critical Fixes)
1. **Task 0** → Profile Persist Fix
2. **Task 9** → Signup OTP
3. **Task 10** → Reset Password OTP
4. **Task 5** → Enroll→Payment Flow
5. **Task 1** → Header/TopBar Hide Fix

### Phase 2 (Core Features)
6. **Task 4** → My-Courses Enrolled Only
7. **Task 3** → Instructor Stats Fix
8. **Task 2** → Real Reviews

### Phase 3 (Content Enhancement)
9. **Task 6** → What You'll Learn
10. **Task 7** → PDF/Images Resources

### Phase 4 (Book System)
11. **Task 8** → Book System

---

## Detailed Task Breakdown

### Task 0: User Profile Data Persist Fix 🟢
**Problem:** Institute, semester, phone number not saving to Appwrite. Lost on logout. Phone shows random values.

**Root Causes:**
1. Appwrite `users` collection may not have required attributes (phone, bio, semester, instituteId)
2. Profile update API maps fields but Appwrite rejects unknown attributes
3. On login, `/auth/me` reads from Appwrite user doc — if attributes missing, values empty
4. `instituteId` in Appwrite stored as number but Worker reads as string
5. On logout, localStorage cleared — no server-side recovery

**Fix Plan:**
- [x] Worker API: Ensure `/auth/login` and `/auth/me` return all profile fields correctly
- [x] Worker API: Add `institute_id` (snake_case) alias alongside `instituteId` in user doc create
- [x] Worker API: Profile update endpoint - add fallback for missing Appwrite attributes
- [x] Student Web: On app load, call `refreshUser()` to sync from server
- [x] Student Web: After profile save, call `refreshUser()` to verify persistence
- [ ] Test: Edit profile → save → logout → login → verify data persists

**Files to modify:**
- `dakkho-admin/worker/src/routes/student-api.ts`
- `dakkho-student-web/src/lib/store.ts`
- `dakkho-student-web/src/components/dakkho/profile/EditProfilePage.tsx`

---

### Task 1: Header/TopBar Items Hide Fix 🔴
**Problem:** TopBar items (search, notifications, avatar) hide on navigation due to ServerConfigStore race condition.

**Fix Plan:**
- [ ] Investigate ServerConfigStore loading timing vs TopBar render
- [ ] Ensure TopBar uses DEFAULT_CONFIG while loading, not empty state
- [ ] Add config ready check before hiding elements

---

### Task 2: Real Reviews (Replace Mock) 🔴
**Problem:** CourseReviewsPage uses `MOCK_REVIEWS` array instead of real API data.

**Fix Plan:**
- [ ] Create D1 `course_reviews` table (similar to `instructor_reviews`)
- [ ] Worker API: Add `GET /api/courses/:id/reviews` and `POST /api/courses/:id/reviews`
- [ ] Student Web: Replace mock data with API calls in CourseReviewsPage
- [ ] Student Web: Add review submission form for enrolled students

---

### Task 3: Instructor Stats Fix 🔴
**Problem:** Instructor stats (totalStudents, totalCourses, totalVideos) may show 0 or incorrect values.

**Fix Plan:**
- [ ] Verify the query logic in `/api/instructors/:id` endpoint
- [ ] Ensure enrollment counting works with both Appwrite + D1 data
- [ ] Add caching for expensive aggregation queries

---

### Task 4: My-Courses Show Enrolled Only 🔴
**Problem:** MyCoursesPage shows all courses instead of only enrolled ones.

**Fix Plan:**
- [ ] Student Web: Use `studentProfileApi.enrollments()` to fetch enrolled courses
- [ ] Student Web: Replace course listing with enrollment-based data
- [ ] Add loading state and empty state for no enrollments

---

### Task 5: Enroll → Payment Page Flow 🔴
**Problem:** "Enroll Now" button goes directly to video player instead of payment page.

**Fix Plan:**
- [ ] Student Web: Create proper EnrollmentPage with payment options
- [ ] Student Web: Route "Enroll Now" → EnrollmentPage → Payment
- [ ] Worker API: Verify enrollment check before video access
- [ ] Integrate PipraPay payment flow

---

### Task 6: "What You'll Learn" - Admin Select+Search+Text 🔴
**Problem:** No "What You'll Learn" section in courses.

**Fix Plan:**
- [ ] D1: Create `course_learning_items` table
- [ ] Admin Web: Add searchable select + custom text field in course form
- [ ] Worker API: CRUD endpoints for learning items
- [ ] Student Web: Display "What You'll Learn" section on course detail page

---

### Task 7: PDF/Images Optional Resources per Lesson 🔴
**Problem:** No way to attach PDF/images as resources to video lessons.

**Fix Plan:**
- [ ] D1: Create `lesson_resources` table
- [ ] R2: Upload endpoint for PDF/images
- [ ] Admin Web: Add resource upload in video/lesson edit form
- [ ] Worker API: CRUD endpoints for resources
- [ ] Student Web: Display resources on video player page
- [ ] Student Web: Built-in PDF reader with micro animations

---

### Task 8: Book System 🔴
**Problem:** No book purchasing/reading system.

**Fix Plan:**
- [ ] D1: Create `books` table (title, author, type=PDF/Physical, price, description, cover_image, pdf_url, delivery_info)
- [ ] D1: Create `book_orders` table (user_id, book_id, type, price, status, delivery_address, tracking)
- [ ] Admin Web: Book management CRUD with pricing
- [ ] Worker API: Book listing, ordering, delivery endpoints
- [ ] Student Web: Book catalog, detail page, order flow
- [ ] Student Web: Built-in PDF reader with micro animations for PDF books
- [ ] Student Web: Delivery tracking for physical books

---

### Task 9: Signup OTP Before DB Store 🟢
**Problem:** Current signup creates pending_signup in D1 but OTP flow needs to be verified to ensure no account is created before OTP verification.

**Current State:** Already implemented! The flow is: signup → pending_signup + OTP → verify OTP → create Appwrite account. Need to verify this works correctly.

**Status:** Already implemented correctly!
- [x] Verify signup flow: no Appwrite account before OTP verified
- [x] SignupPage uses 4-step flow: Info → Password → Institute+Terms → OTP verify
- [x] Worker stores in pending_signups, sends OTP, only creates account on verify
- [x] OTP verified → Appwrite account + user doc + D1 session + auto-login

---

### Task 10: Reset Password OTP via Email 🟢
**Problem:** Reset password doesn't send OTP to email.

**Current State:** Already fully implemented!
- [x] Worker `POST /auth/forgot-password` sends OTP via Resend email
- [x] Worker `POST /auth/reset-password` verifies OTP + updates Appwrite password
- [x] ForgotPasswordPage: 3-step flow (Email → OTP + New Password → Success)
- [x] OTP resend uses `forgotPassword()` which re-sends OTP
- [x] Password strength indicator + confirm password match check

---

## GitHub Repos
- **Worker API:** `https://github.com/grayrat2026/dakkho-admin`
- **Admin Web:** `https://github.com/grayrat2026/dakkho-admin-web`
- **Student Web:** `https://github.com/grayrat2026/dakkho-student-web`

## Deployment
- Worker: `cd dakkho-admin/worker && npx wrangler deploy`
- Admin Web: `cd dakkho-admin-web && npm run build && npx wrangler pages deploy out/ --project-name=dakkho-admin`
- Student Web: `cd dakkho-student-web && npm run build && npx wrangler pages deploy out/ --project-name=dakkhostudent`

---

## Work Log

*Work entries will be added here as tasks are completed.*
