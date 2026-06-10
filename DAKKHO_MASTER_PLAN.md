# DAKKHO Master Plan — Full Feature Roadmap

> **Last Updated**: 2026-06-08  
> **Status Legend**: ✅ Done | 🔧 In Progress | ⬜ Planned | ❌ Blocked

---

## 🚨 CRITICAL BUGS (Fix NOW — Before Any New Feature)

| # | Bug | Status | Details |
|---|-----|--------|---------|
| B1 | Paid course free enrollment | ⬜ | `EnrollmentPage.handleFreeEnroll` catch block navigates directly to video-player, bypassing payment. Also `packages.find(p => p.price === 0) \|\| packages[0]` picks paid pkg as fallback. |
| B2 | `price` vs `price_bdt` mismatch | ⬜ | Appwrite stores `price_bdt`, frontend checks `course.price`. Course shows as Free when price_bdt exists. |
| B3 | Instructor shows 3 courses, admin shows 2 | ⬜ | Instructor profile counts ALL courses (including deleted/unpublished). Need `is_deleted=false AND is_published=true` filter. |
| B4 | Enrollment button always shows "Enroll Now" | ⬜ | No `is_enrolled` / `watch_progress` check. Need 3-state button: Enroll Now / Start Learning / Continue. |
| B5 | `video_url` unknown attribute error | ✅ | Fixed: Standalone worker was mapping `videoUrl → video_url` but Appwrite only has `videoUrl`. Removed snake_case mapping. Deployed. |

---

## Phase 0: Infrastructure & Core Fixes (CURRENT)

### 0.1 — Fix Paid Course Free Enrollment Bug
- **Status**: 🔧 In Progress
- **Files**: `dakkho-student-web/src/components/dakkho/course/EnrollmentPage.tsx`, `worker/src/routes/student-api.ts`
- **What**:
  - [ ] Remove `navigate('video-player')` from `handleFreeEnroll` catch block — show error instead
  - [ ] Fix `packages.find(p => p.price === 0) || packages[0]` — only use free packages
  - [ ] Add backend `POST /student/enroll/free` endpoint that validates course price === 0 before creating enrollment
  - [ ] Add server-side price validation: if course.price > 0, reject free enrollment

### 0.2 — Fix Course Price Field Mapping
- **Status**: ⬜
- **Files**: `worker/src/routes/courses.ts`, student web `data-hooks.ts`, `api-client.ts`
- **What**:
  - [ ] In `mapCourseFromAppwrite`, add `price: doc.price_bdt || 0` mapping
  - [ ] In student web data hooks, map `price_bdt → price` when reading courses
  - [ ] Ensure admin panel creates course with both `price` and `price_bdt` attributes

### 0.3 — Enrollment Button Logic (3-State)
- **Status**: ⬜
- **What**:
  - [ ] `is_enrolled = false` → **[Enroll Now / Buy Now]** button → navigate to enrollment page
  - [ ] `is_enrolled = true AND watch_progress = 0` → **[Start Learning →]** → navigate to first video
  - [ ] `is_enrolled = true AND watch_progress > 0` → **[Continue →]** → navigate to `last_watched_video_id` at `last_position`
  - [ ] Add toast: "Resuming from Section 2 • Lecture 4..."

### 0.4 — D1 Migration & Deployment
- **Status**: ⬜
- **What**:
  - [ ] Run `POST /migration/d1-tables` to create `course_reviews`, `course_learning_items`, `lesson_resources`, `books`, `book_orders`
  - [ ] Deploy worker via `npx wrangler deploy` from `worker/` directory
  - [ ] Deploy student web via `npx wrangler pages deploy out/ --project-name=dakkho-student`
  - [ ] Deploy admin web via `npx wrangler pages deploy out/ --project-name=dakkho-admin`
  - [ ] End-to-end test: signup → login → browse course → enroll (free + paid) → watch video

### 0.5 — PipraPay Automatic Webhook Verification (P1 — UPGRADED from Phase 4.5)
- **Status**: ⬜
- **Priority**: 🟠 P1 (was P3 — upgraded because manual verify is unreliable)
- **What**:
  - [ ] Configure PipraPay webhook URL: `https://dakkho-admin-api.dakkho-admin.workers.dev/api/payment/webhook`
  - [ ] On payment success → auto-verify + auto-enroll (no admin manual step)
  - [ ] On payment fail → log + notify student to retry
  - [ ] Webhook signature verification (PipraPay secret key)
  - [ ] Idempotency: same `pp_id` processed only once
  - [ ] Fallback: manual verify still available for edge cases
  - [ ] PipraPay sandbox + live mode toggle in admin settings
  - [ ] Test with PipraPay sandbox before going live

---

## Phase 1: Soft Delete & Data Integrity

### 1.1 — Soft Delete System (7-Day Trash)
- **Status**: ⬜
- **What**:
  - [ ] Add `is_deleted` (BOOLEAN DEFAULT 0) and `deleted_at` and `deleted_by` columns to: courses, videos, users, instructors
  - [ ] All queries add `WHERE is_deleted = 0` filter
  - [ ] Admin delete action sets `is_deleted = 1, deleted_at = NOW()` instead of hard delete
  - [ ] Add `GET /admin/trash` endpoint to list deleted items
  - [ ] Add `POST /admin/trash/:type/:id/restore` to restore within 7 days
  - [ ] Add scheduled worker (cron) to permanently delete items where `deleted_at < NOW() - 7 days`
  - [ ] User delete: soft delete user + related profile/courses, keep payment history for 1 year
  - [ ] Course delete: soft delete course + cascade to enrollments (keep for audit)
  - [ ] Video delete: soft delete video + related progress data

### 1.2 — Instructor Course Count Fix
- **Status**: ⬜
- **What**:
  - [ ] Instructor profile: count only `is_deleted = false AND is_published = true` courses
  - [ ] Instructor API: filter courses by published + not-deleted status
  - [ ] Admin dashboard: count all courses (including unpublished), but exclude deleted

---

## Phase 2: Instructor Page Redesign & Features

### 2.1 — Instructor Profile Page Overhaul
- **Status**: ⬜
- **What**:
  - [ ] Bio section with **Markdown support** (react-markdown renderer)
  - [ ] Social links: YouTube, GitHub, Facebook, LinkedIn (stored in Appwrite instructor doc)
  - [ ] Expertise tags: Electronics, IoT, Embedded Systems, etc. (stored as array)
  - [ ] Joined date display
  - [ ] Instructor Verification Badge:
    - ✅ Verified Instructor (admin manually approve)
    - 🎓 BTEB Certified (diploma certificate upload)
    - Show badge on profile + course cards

### 2.2 — Instructor Courses Tab
- **Status**: ⬜
- **What**:
  - [ ] Show only `is_deleted = false AND is_published = true` courses
  - [ ] Sort options: Latest / Most Popular / Rating
  - [ ] Course card: enrollment count, rating, price/FREE badge
  - [ ] 3-state button: Enroll Now / Start Learning / Continue (as per 0.3)

### 2.3 — Instructor Reviews Tab
- **Status**: ⬜
- **What**:
  - [ ] Overall rating breakdown (5★ → 1★ bar chart)
  - [ ] Recent reviews with pagination
  - [ ] Helpful/Unhelpful voting

### 2.4 — Instructor Settings Modal
- **Status**: ⬜
- **What**:
  - [ ] Profile Edit (name, bio, avatar, cover)
  - [ ] Social Links editor
  - [ ] Notification Preferences (new enrollment, new review, payment received)
  - [ ] Payout Info (bKash/Nagad number)
  - [ ] Visibility toggle (Public / Unlisted)
  - [ ] Danger Zone: Deactivate Account (7-day trash), Transfer Courses to another instructor

---

## Phase 3: Enrollment Analytics & Access Control

### 3.1 — Enrollment Analytics Dashboard
- **Status**: ⬜
- **What**:
  - [ ] Today/Week/Month enrollment counts + revenue
  - [ ] Dropout Rate (avg lectures before dropout)
  - [ ] Most-watched / Least-watched lecture stats
  - [ ] Available for Admin + Instructor (own courses only)

### 3.2 — Course Access Expiry
- **Status**: ⬜
- **What**:
  - [ ] Instructor/Admin can set: lifetime / 6 months / 1 year access
  - [ ] 7-day before expiry: notify user
  - [ ] Show re-enroll option with discounted price

### 3.3 — Course Preview Lock
- **Status**: ⬜
- **What**:
  - [ ] Not enrolled → only first N lectures free (instructor/admin sets N)
  - [ ] After preview limit → paywall popup: "Enroll to access remaining {X} lectures"
  - [ ] Video player: check enrollment before playing non-preview videos

### 3.4 — Watch Time Heatmap (Instructor Analytics) — NEW
- **Status**: ⬜
- **What**:
  - [ ] Track watch progress in 10-second intervals per video
  - [ ] D1 table: `video_heatmap` (video_id, second_range, view_count, drop_count)
  - [ ] Instructor sees color-coded heatmap on video timeline:
    - 🟢 Green = most watched / rewatched sections
    - 🟡 Yellow = normal watch rate
    - 🔴 Red = sections where most students skip/drop off
  - [ ] Insights text: "এই 2 মিনিট কেউ দেখে না — এই অংশ improve করুন"
  - [ ] Aggregate heatmap: all students combined
  - [ ] Per-video analytics page: avg watch time, completion rate, peak drop-off point
  - [ ] Admin sees heatmap across all courses
  - [ ] Data collection: piggyback on video progress auto-save (Phase 5.1) — aggregate every 10s interval

---

## Phase 4: Admin Bulk Actions & Security

### 4.1 — Bulk Actions (Admin Panel)
- **Status**: ⬜
- **What**:
  - [ ] Multi-select courses/videos/users
  - [ ] Bulk Delete → Trash
  - [ ] Bulk Publish/Unpublish
  - [ ] Bulk Move to different instructor
  - [ ] Export data (CSV)

### 4.2 — Enrollment Lock (Anti-abuse)
- **Status**: ⬜
- **What**:
  - [ ] Same IP 10+ free enroll in 1 hour → block + alert
  - [ ] Payment without valid TrxID → reject
  - [ ] bKash/Nagad TrxID used more than once → block/deactivate user
  - [ ] Blocked user login shows: "Contact Support — Your account is {status}"
  - [ ] Suspicious pattern → auto flag for admin review

### 4.3 — Role-Based Access Control (RBAC)
- **Status**: ⬜
- **What**:
  - [ ] Admin roles: Super Admin / Content Moderator / Support Agent / Finance
  - [ ] Each role has different permissions
  - [ ] Support agent: only view tickets, cannot delete
  - [ ] Super Admin: full access

### 4.4 — Audit Log
- **Status**: ⬜
- **What**:
  - [ ] Record: who, when, what action, on what resource
  - [ ] "Admin X deleted Course Y at 3:45 AM on June 23"
  - [ ] Suspicious activity alert (e.g., bulk delete at 3 AM)
  - [ ] 90-day retention

### 4.5 — Manual Payment Verification (Fallback only — Primary is 0.5 Webhook)
- **Status**: ⬜
- **What**:
  - [ ] Admin can approve/reject manual payments via bKash/Nagad TrxID
  - [ ] Student support ticket → direct enrollment
  - [ ] Partial refund option (triggered from admin, actioned via PipraPay)
  - [ ] Note: Primary payment flow is now automatic via webhook (Phase 0.5). Manual is fallback only.

---

## Phase 5: Video & Learning Features

### 5.1 — Video Progress Auto-save
- **Status**: ⬜
- **What**:
  - [ ] Every 10 seconds: save progress to backend (no spinner)
  - [ ] Offline: save to IndexedDB, sync when online
  - [ ] Show "Last watched 2 hours ago" label
  - [ ] Also feeds data into Watch Time Heatmap (Phase 3.4)

### 5.2 — Picture-in-Picture (PiP)
- **Status**: ⬜
- **What**:
  - [ ] Floating video window when app minimized
  - [ ] Background audio play

### 5.3 — Playback Speed
- **Status**: ⬜
- **What**:
  - [ ] 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x options
  - [ ] Remember per-user default speed

### 5.4 — Screen Lock during Video
- **Status**: ⬜
- **What**:
  - [ ] Lock button to prevent accidental pause/seek
  - [ ] Only volume/brightness work when locked
  - [ ] Manual on/off toggle for student

### 5.5 — Video Watermark (Anti-piracy)
- **Status**: ⬜
- **What**:
  - [ ] Subtle logged-in user name/ID watermark
  - [ ] Dynamic position (moves corner to corner)
  - [ ] Report piracy button

### 5.6 — Device Limit
- **Status**: ⬜
- **What**:
  - [ ] Max 1 device simultaneous watch per account
  - [ ] New device login → notify old device
  - [ ] "Logout other devices" option

### 5.7 — Note-Taking (In-video)
- **Status**: ⬜
- **What**:
  - [ ] Take notes during video, auto-link to timestamp
  - [ ] "2:34 — Ohm's law: V=IR" → click to jump to moment
  - [ ] Export notes as PDF

### 5.8 — Video Bookmarks (One-Tap) — NEW
- **Status**: ⬜
- **What**:
  - [ ] One-tap bookmark button on video player → saves current timestamp
  - [ ] D1 table: `video_bookmarks` (id, user_id, video_id, course_id, timestamp_seconds, label, created_at)
  - [ ] Auto-label: "Bookmark at 5:34" (user can edit label later)
  - [ ] "My Bookmarks" page — grouped by course, then by video
  - [ ] Click bookmark → jump directly to that second in the video
  - [ ] Visual markers on video progress bar (small dots for each bookmark)
  - [ ] Delete bookmark (swipe or long-press on mobile)
  - [ ] Bookmark count per video shown in video details
  - [ ] Different from Notes (5.7) — bookmarks are quick timestamps, notes are text content

### 5.9 — Doubt Section (Q&A per Lecture)
- **Status**: ⬜
- **What**:
  - [ ] Q&A thread below each video
  - [ ] Student asks, instructor or other students answer
  - [ ] Upvote system — most helpful answer on top
  - [ ] Instructor reply gets 🎓 badge
  - [ ] Unanswered questions → auto-notify instructor

### 5.10 — Lecture Resource Attachments — NEW
- **Status**: ⬜
- **What**:
  - [ ] Instructor/Admin can attach PDF/image files to each lecture (stored in R2)
  - [ ] D1 table `lesson_resources` already exists — use it fully
  - [ ] R2 bucket: `dakkho-resources` — upload endpoint already exists
  - [ ] Student view: resource list below video player (only if enrolled)
  - [ ] Download button for enrolled students
  - [ ] In-app PDF viewer (react-pdf or iframe) — no external app needed
  - [ ] Image preview (lightbox)
  - [ ] Resource count shown on course curriculum (e.g., "5 resources")
  - [ ] Admin: manage resources in video edit dialog (add/remove/reorder)
  - [ ] File size limit: 50MB per resource

---

## Phase 6: Gamification & Engagement

### 6.1 — Streak System
- **Status**: ⬜
- **What**:
  - [ ] Consecutive days learning counter
  - [ ] 7-day streak = 🔥 badge, 30-day = 🏆 badge
  - [ ] Day-before-break push notification: "You haven't studied today, streak will break!"
  - [ ] Leaderboard: most active students this month (per course/batch)

### 6.2 — Smart Push Notifications
- **Status**: ⬜
- **What**:
  - [ ] New lecture upload → notify enrolled students
  - [ ] "80% of your batch completed Lecture 5, you're falling behind"
  - [ ] Weekly summary: "0 minutes studied this week"
  - [ ] Payment success/failure instant notify

### 6.3 — Announcement System
- **Status**: ⬜
- **What**:
  - [ ] Instructor/Admin: course-level announcements
  - [ ] Platform-wide announcements (maintenance, new feature)
  - [ ] Read/unread tracking

---

## Phase 7: Coupon, Bundle & Affiliate

### 7.1 — Coupon / Discount System
- **Status**: ⬜
- **What**:
  - [ ] Instructor/Admin can create coupons
  - [ ] Types: Percentage (20% off) / Fixed (৳100 off) / Free (100% off)
  - [ ] Expiry date, max usage limit, per-user limit
  - [ ] Admin global coupon (works on all courses)
  - [ ] Referral code system — student refers → discount

### 7.2 — Bundle / Pack
- **Status**: ⬜
- **What**:
  - [ ] Multiple courses bundled together at discount
  - [ ] "3rd Semester Complete Pack — ৳ 499 (separately ৳ 800)"
  - [ ] Auto-enroll in all bundled courses
  - [ ] Email + App notification at bundle end: "Submit TxnID for uninterrupted access"

### 7.3 — Affiliate Program
- **Status**: ⬜
- **What**:
  - [ ] Student shares affiliate link → 10-15% commission on sale
  - [ ] Dashboard: earnings, clicks, conversions
  - [ ] Minimum ৳ 200 → course discount

### 7.4 — Flash Sale / Limited-Time Offer
- **Status**: ⬜
- **What**:
  - [ ] Admin sets time-limited sale
  - [ ] Course card countdown timer: "⏰ 2:34:10 remaining"
  - [ ] Sale ends → original price auto-restore

---

## Phase 8: Community & Social

### 8.1 — Student Community / Forum
- **Status**: ⬜
- **What**:
  - [ ] Course-specific discussion board
  - [ ] General Polytechnic Q&A board
  - [ ] Post, reply, upvote, save
  - [ ] Instructor featured answer

### 8.2 — Peer Study Group
- **Status**: ⬜
- **What**:
  - [ ] Same-course students can create groups
  - [ ] Group chat (in-app)
  - [ ] Study session scheduling

### 8.3 — Re-engagement Campaign
- **Status**: ⬜
- **What**:
  - [ ] 14 days no login → "Did you forget us?" email/SMS
  - [ ] 30 days → special offer "Come back, 20% off"
  - [ ] Incomplete course reminder: "Only 3 lectures left!"

### 8.4 — Student Public Profile — NEW
- **Status**: ⬜
- **What**:
  - [ ] Student profile page: completed courses, certificates, streak, join date
  - [ ] Privacy setting: Public / Private / Course-mates only (student controls)
  - [ ] Shareable link: `dakkho.pro.bd/student/himadri`
  - [ ] Profile sections:
    - Header: avatar, name, technology, institute, semester
    - Stats: courses completed, total hours studied, current streak, longest streak
    - Badges: earned achievement badges (from streak/gamification system)
    - Courses: completed + in-progress (only if profile is public)
  - [ ] Instructor can view their course students' profiles
  - [ ] D1 table: `student_profiles` (user_id, is_public, show_streak, show_courses, show_badges, slug, updated_at)
  - [ ] Slug generation: auto from fullName, uniqueness check
  - [ ] Profile page SEO: meta tags for public profiles

---

## Phase 9: Search & Recommendation

### 9.1 — Smart Search
- **Status**: ⬜
- **What**:
  - [ ] Search course title + instructor name + topic simultaneously
  - [ ] "3rd semester digital electronics" → relevant courses
  - [ ] Search history + trending searches
  - [ ] Typo tolerance: "electrnics" → "electronics"

### 9.2 — Recommendation Engine
- **Status**: ⬜
- **What**:
  - [ ] "Courses like what you've watched" section
  - [ ] Batch-mates reading (anonymized)
  - [ ] "After this course, students usually take..." suggestions
  - [ ] Based on user interest & situation (not random)

---

## Phase 10: Live Class & Course Builder

### 10.1 — Live Class Integration
- **Status**: ⬜
- **What**:
  - [ ] Scheduled live class calendar
  - [ ] 30-min before reminder notification
  - [ ] Live recording auto-upload to course
  - [ ] Chat + Q&A during live (moderated)
  - [ ] Attendance tracking

### 10.2 — Course Builder Improvement
- **Status**: ⬜
- **What**:
  - [ ] Drag & drop lecture reorder
  - [ ] Bulk video upload
  - [ ] Quiz inside Chapter/Section
  - [ ] Free preview toggle per lecture
  - [ ] Course thumbnail auto-generate from first video frame

### 10.3 — Student Management (Admin)
- **Status**: ⬜
- **What**:
  - [ ] Manually enroll a student (admin gift)
  - [ ] Forcibly reset student progress (re-attempt)
  - [ ] Ban student from course (with/without refund)
  - [ ] Bulk message enrolled students

### 10.4 — Co-instructor Support
- **Status**: ⬜
- **What**:
  - [ ] Multiple instructors per course
  - [ ] Revenue split (60/40, 70/30)
  - [ ] Each instructor gets credit on their name

---

## Phase 11: Revenue & Finance

### 11.1 — Revenue Dashboard (Admin + Instructor)
- **Status**: ⬜
- **What**:
  - [ ] Daily / Weekly / Monthly / Yearly revenue graph
  - [ ] Course-wise breakdown
  - [ ] Pending payout vs received
  - [ ] Tax-ready export (CSV/PDF)
  - [ ] Coupon performance analytics

---

## Phase 12: Security & Trust

### 12.1 — Course Review Verification
- **Status**: ⬜
- **What**:
  - [ ] Only enrolled + 30%+ progress students can review
  - [ ] Fake review prevention
  - [ ] Instructor can flag review, admin verifies

### 12.2 — Two-Factor Authentication (2FA)
- **Status**: ⬜
- **What**:
  - [ ] Instructor: mandatory 2FA (Authenticator app)
  - [ ] Student: optional 2FA
  - [ ] TOTP-based (Google Authenticator compatible)

### 12.3 — Platform Health Dashboard
- **Status**: ⬜
- **What**:
  - [ ] Total users, DAU, MAU
  - [ ] Server load, error rate
  - [ ] Payment success rate (bKash/Nagad separately)
  - [ ] Most crashed pages / error logs

### 12.4 — Error Monitoring (Sentry Integration) — NEW
- **Status**: ⬜
- **What**:
  - [ ] Sentry integration for Cloudflare Worker (backend)
    - Use `@sentry/cloudflare` or Sentry tunnel endpoint
    - Capture unhandled exceptions in Hono error handler
    - Attach user ID, route, request metadata to each event
  - [ ] Sentry integration for Next.js (frontend — admin + student)
    - Use `@sentry/nextjs` SDK
    - Capture React errors, API failures, unhandled promise rejections
    - Source maps upload for readable stack traces
  - [ ] Auto-report: every uncaught error → Sentry, no manual step
  - [ ] Stack trace with: file, line number, function name
  - [ ] User context: user ID, email, role, route
  - [ ] Performance monitoring: API response times, page load times
  - [ ] Alert rules:
    - Error spike > 10 in 5 min → Slack/Discord notification
    - New error type → email admin
  - [ ] Dashboard in admin panel: error rate graph (connects to Phase 12.3)
  - [ ] DSN and config stored in Cloudflare environment variables
  - [ ] Sampling rate: 100% for errors, 10% for performance traces

---

## Phase 13: Instructor Separate Site

### 13.1 — Instructor Web App (Separate from Student)
- **Status**: ⬜
- **What**:
  - [ ] New Next.js project: `dakkho-instructor-web`
  - [ ] Same theme/UI as student app but instructor-focused
  - [ ] No student features (no explore, no community, etc.)
  - [ ] **Separate subdomain on Cloudflare Pages** (e.g., `instructor.dakkho.pro.bd` or `dakkho-instructor.pages.dev`)
  - [ ] Login only (NO signup) + mandatory 2FA (Authenticator)
  - [ ] "Request to become instructor" option — sends request to admin with:
    - Personal details (extensive: education, experience, certifications)
    - Proof documents upload
    - Background verification info
  - [ ] Admin approves/denies instructor requests
  - [ ] Instructor Dashboard: own courses, students, revenue, analytics
  - [ ] Course management: CRUD own courses only
  - [ ] Video upload & management
  - [ ] Student progress viewer
  - [ ] Revenue & payout dashboard
  - [ ] Announcement & notification system
  - [ ] Settings: profile, social links, payout info, 2FA

---

## Phase 14: Content Drip & Learning Path — NEW

### 14.1 — Content Drip (Scheduled Unlock)
- **Status**: ⬜
- **What**:
  - [ ] Instructor/Admin sets drip schedule per course:
    - "Week 1 → Lecture 1-5, Week 2 → Lecture 6-10"
    - Or: "Enroll করার X দিন পর lecture unlock হবে"
  - [ ] D1 table: `content_drip_rules` (id, course_id, lecture_range_start, lecture_range_end, unlock_after_days, created_by)
  - [ ] Student sees locked lectures with: "Available in 3 days 🔒"
  - [ ] Unlock happens automatically based on enrollment date
  - [ ] Instructor can override: manually unlock for specific student
  - [ ] Drip preview in course builder (timeline view)
  - [ ] Use case: Cohort-based learning — all students progress together
  - [ ] Notification: "Lecture 6-10 এখন আনলক! 🎉" when new batch unlocks

### 14.2 — Learning Path / Roadmap
- **Status**: ⬜
- **What**:
  - [ ] BTEB semester-based curated course sequences
  - [ ] Example: "Electronics Diploma 3rd Semester Path" → 5 courses in order
  - [ ] D1 table: `learning_paths` (id, title, title_bn, description, technology_id, semester, thumbnail_url, is_published, sort_order, created_by, created_at)
  - [ ] D1 table: `learning_path_courses` (id, path_id, course_id, sort_order, is_required)
  - [ ] D1 table: `user_path_progress` (id, user_id, path_id, completed_courses_json, current_course_id, started_at, completed_at)
  - [ ] Visual progress: "3/5 courses completed — 60% done"
  - [ ] Progress bar + milestones per path
  - [ ] Admin/Instructor creates paths in admin panel
  - [ ] Student browses paths: "আপনার সেমিস্টারের লার্নিং পাথ"
  - [ ] Path detail page: ordered course list with progress status
  - [ ] Auto-suggest next course in path after completing one
  - [ ] Path completion certificate (future)

---

## Phase 15: Webhook System — NEW

### 15.1 — Webhook Infrastructure
- **Status**: ⬜
- **What**:
  - [ ] Outgoing webhooks: notify external services on platform events
    - PipraPay payment success/fail → already handled (Phase 0.5)
    - New enrollment → configurable webhook
    - Course published → configurable webhook
  - [ ] Incoming webhooks: receive data from external services
    - Third-party integration support (future CRM, analytics, etc.)
  - [ ] D1 table: `webhook_subscriptions` (id, event_type, target_url, secret, is_active, created_by, created_at)
  - [ ] D1 table: `webhook_logs` (id, subscription_id, event_type, payload, response_status, response_body, attempts, created_at)
  - [ ] Admin panel: manage webhooks (add/edit/delete/toggle)
  - [ ] Webhook logs viewer in admin panel:
    - Filter by event type, status, date
    - View full payload and response
    - Retry failed webhooks
  - [ ] Retry mechanism: failed delivery → retry 3 times with exponential backoff (1min, 5min, 15min)
  - [ ] Signature verification: HMAC-SHA256 signature in `X-Webhook-Signature` header
  - [ ] Rate limiting: max 100 webhooks per minute per subscription
  - [ ] Event types: `payment.success`, `payment.failed`, `enrollment.created`, `course.published`, `user.registered`, `review.created`

---

## Phase 16: Appwrite → D1 Full Migration — PLANNED (IMPLEMENT WHEN TOLD)

### 16.1 — Migration Strategy
- **Status**: ⬜
- **Note**: This is a LONG-TERM migration. Do NOT implement until explicitly told. Current system uses both Appwrite (NoSQL) and D1 (SQL) — this dual-database approach increases complexity. Goal: migrate everything to D1, remove Appwrite dependency entirely.
- **What**:
  - [ ] Phase A: Audit all Appwrite collections and their attributes
  - [ ] Phase B: Create corresponding D1 tables for each Appwrite collection:
    - `users` → `users` (D1)
    - `courses` → `courses` (D1)
    - `videos` → `videos` (D1)
    - `instructors` → `instructors` (D1)
    - `enrollments` → `enrollments` (D1)
    - `categories` → `categories` (D1)
    - `notifications` → `notifications` (D1)
    - `discussions` → `discussions` (D1)
    - `watch_progress` → `watch_progress` (D1)
    - `bookmarks` → `bookmarks` (D1)
    - `user_settings` → `user_settings` (D1)
  - [ ] Phase C: Data migration script — copy all Appwrite documents to D1 rows
  - [ ] Phase D: Update worker API routes to use D1 instead of Appwrite
  - [ ] Phase E: Update student web API client to match new D1-based responses
  - [ ] Phase F: Update admin web to use D1-based API
  - [ ] Phase G: Remove Appwrite SDK and config from all projects
  - [ ] Phase H: Test everything end-to-end
  - **Benefits**: Single source of truth (D1 SQL), simpler queries, joins, transactions, no attribute mapping headaches
  - **Risk**: Large migration, needs careful testing. Appwrite auth (login/signup) needs replacement with custom JWT auth on D1.

---

## Architecture Notes

### Tech Stack
- **Backend**: Hono 4 on Cloudflare Workers
- **Database**: Cloudflare D1 (SQL) + Appwrite (NoSQL) — **Long-term: migrate fully to D1 (Phase 16)**
- **File Storage**: Cloudflare R2 (buckets: `dakkho-videos`, `dakkho-thumbnails`, `dakkho-avatars`, `dakkho-resources`)
- **Cache**: Cloudflare KV (namespace: `f61a482ba88a45bebb35dfd600cd742d`)
- **Admin Web**: Next.js (`output: "export"`) → Cloudflare Pages (`dakkho-admin.pages.dev`)
- **Student Web**: Next.js (`output: "export"`) → Cloudflare Pages (`dakkhostudent.pages.dev` / `dakkho.pro.bd`)
- **Instructor Web**: Next.js (NEW) → Cloudflare Pages (**separate subdomain**, e.g., `instructor.dakkho.pro.bd` or `dakkho-instructor.pages.dev`)
- **Error Monitoring**: Sentry (Phase 12.4)
- **Payment**: PipraPay (automatic webhook verification — Phase 0.5)
- **Email**: Resend
- **Push**: OneSignal
- **State**: Zustand
- **Deploy**: `npx wrangler pages deploy out/ --project-name=<name>` (web), `npx wrangler deploy` (worker)

### GitHub Repos
- Worker: `https://github.com/grayrat2026/dakkho-admin`
- Admin Web: `https://github.com/grayrat2026/dakkho-admin-web`
- Student Web: `https://github.com/grayrat2026/dakkho-student-web`
- Instructor Web: (NEW — to be created)

### Cloudflare
- D1 Database ID: `2e3dabbe-44c7-a7d1-eba001aa0a4a` (name: `dakkho-admin-db`)
- R2 Buckets: `dakkho-videos`, `dakkho-thumbnails`, `dakkho-avatars`, `dakkho-resources`
- KV Namespace: `f61a482ba88a45bebb35dfd600cd742d`
- Worker URL: `https://dakkho-admin-api.dakkho-admin.workers.dev`

### Appwrite
- Endpoint: `https://sgp.cloud.appwrite.io/v1`
- Project: `dakkho`
- Database: `dakkho_main`
- Collections: users, courses, videos, instructors, categories, enrollments, notifications, discussions, user_settings, bookmarks, watch_progress
- **All Appwrite collection attributes use CAMELCASE** (videoUrl, courseId, thumbnailUrl, isPublished, etc.)
- **Do NOT send snake_case attributes to Appwrite** — causes "Unknown attribute" errors

---

## Execution Priority

| Priority | Phase | Timeline | Notes |
|----------|-------|----------|-------|
| 🔴 P0 | Phase 0 (Bug fixes + PipraPay webhook + deploy) | NOW | Webhook auto-verify upgraded to P1 |
| 🟠 P1 | Phase 1 (Soft delete) | Next | |
| 🟡 P2 | Phase 2 (Instructor redesign) | After P1 | |
| 🟢 P3-P4 | Analytics + Heatmap, Bulk, Security | After P2 | Heatmap is new in P3 |
| 🔵 P5-P6 | Video features (bookmarks, resources), Gamification | After P3 | Bookmarks + Resources new in P5 |
| 🟣 P7-P8 | Coupon/Bundle, Community + Student Profile | After P5 | Student Profile new in P8 |
| ⚪ P9-P11 | Search, Live Class, Revenue | After P7 | |
| 🔶 P12 | Security + Sentry | After P8 | Sentry new in P12 |
| 🔷 P13 | Instructor Separate Site (subdomain) | After P9 | Subdomain-based, not path-based |
| 🔹 P14 | Content Drip + Learning Path | After P10 | Entirely new phase |
| 🔺 P15 | Webhook System | After P0 | Can start earlier — needed for PipraPay |
| ⬛ P16 | Appwrite → D1 Full Migration | WHEN TOLD | Long-term, do NOT start without instruction |

---

## Feature Count Summary

| Category | Count | New in This Update |
|----------|-------|--------------------|
| Critical Bugs | 5 | +1 (B5 video_url — fixed) |
| Phase 0 | 5 items | +1 (0.5 PipraPay webhook) |
| Phase 3 | 4 items | +1 (3.4 Watch Time Heatmap) |
| Phase 5 | 10 items | +2 (5.8 Video Bookmarks, 5.10 Lecture Resources) |
| Phase 8 | 4 items | +1 (8.4 Student Public Profile) |
| Phase 12 | 4 items | +1 (12.4 Sentry Integration) |
| Phase 14 | 2 items | +2 (14.1 Content Drip, 14.2 Learning Path) — NEW PHASE |
| Phase 15 | 1 item | +1 (15.1 Webhook System) — NEW PHASE |
| Phase 16 | 1 item | +1 (16.1 Appwrite → D1 Migration) — NEW PHASE |
| **Total Phases** | **17** (0-16) | +3 new phases |
| **Total Feature Items** | **~80** | +10 new items |
