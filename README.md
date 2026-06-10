<div align="center">

<img src="public/dakkho-logo.png" alt="DAKKHO Logo" width="140" />

# 🎓 DAKKHO — Student Streaming Platform

**Full-Stack EdTech Platform · Admin Dashboard + Student App + Cloudflare Worker API**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono 4](https://img.shields.io/badge/Hono-4-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-18181B?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

</div>

---

## 📑 Table of Contents

- [🆕 Recent Updates](#-recent-updates)
- [📖 Overview](#-overview)
- [🏗️ Architecture](#-architecture)
- [📦 Apps](#-apps)
  - [⚡ Worker API (Backend)](#-worker-api-backend)
  - [🖥️ Admin App (Dashboard)](#-admin-app-dashboard)
  - [📱 Student App (Frontend)](#-student-app-frontend)
- [🧰 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🔐 Environment Variables](#-environment-variables)
- [📡 API Documentation](#-api-documentation)
- [🗄️ Database Schema](#-database-schema)
- [🚢 Deployment](#-deployment)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🆕 Recent Updates

| # | Update | Details |
|---|--------|---------|
| 1 | **Subjects management system** | New dedicated admin page for managing subjects with CRUD, search, filtering, and technology association |
| 2 | **Multiple categories & instructors per course** | New junction tables (`course_subjects`, `course_categories`, `course_instructors`) enable many-to-many relationships |
| 3 | **Course thumbnail upload fix** | Resolved issue with thumbnail uploads for course management |
| 4 | **D1 schema migration for missing columns** | Migration endpoint now handles creating missing tables, columns, and indexes automatically |

---

## 📖 Overview

**DAKKHO** is a full-featured EdTech streaming platform built for polytechnic students in Bangladesh. It delivers video courses, live classes, study materials, and community features through a modern cloud-native architecture running entirely on **Cloudflare's edge network** — Workers for compute, D1 for database, KV for caching, and R2 for media storage.

The platform consists of three tightly integrated applications in a single monorepo:

| App | Description |
|-----|-------------|
| ⚡ **Worker API** | A Hono-based Cloudflare Worker serving as the entire backend — authentication, CRUD operations, file uploads, push notifications, email delivery, and payment processing |
| 🖥️ **Admin App** | A Next.js 16 SPA dashboard with **25 admin panels** for managing every aspect of the platform — courses, videos, instructors, subjects, users, payments, coupons, events, and more |
| 📱 **Student App** | A Next.js 16 SPA with 80+ pages and components providing a Netflix-like streaming experience for students — course catalogs, video playback, progress tracking, bookmarks, achievements, and social features |

---

## 🏗️ Architecture

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     ☁️  Cloudflare Edge                         │
  │                                                                 │
  │   🖥️ Admin App       📱 Student App       ⚡ Worker API       │
  │   ┌───────────┐      ┌───────────┐       ┌───────────┐       │
  │   │ Next.js   │      │ Next.js   │       │  Hono +   │       │
  │   │ SPA       │      │ SPA       │       │  D1       │       │
  │   │ (Pages)   │      │ (Pages)   │       │ (Workers) │       │
  │   └─────┬─────┘      └─────┬─────┘       └─────┬─────┘       │
  │         │                  │                    │               │
  │         └────────┬─────────┘                    │               │
  │                  │  /admin/* & /api/*            │               │
  │                  ▼                              │               │
  │          ┌──────────────────┐                   │               │
  │          │   ⚡ Hono Router │ ◄─────────────────┘               │
  │          └──┬───┬───┬───┬──┘                                   │
  │             │   │   │   │                                        │
  │             ▼   ▼   ▼   ▼                                        │
  │          ┌────┐┌────┐┌────┐┌─────────┐┌──────────┐             │
  │          │ 🗄️ ││ ⚡ ││ 📦 ││  📧    ││  🔔     │             │
  │          │ D1 ││ KV ││ R2 ││ Resend ││OneSignal │             │
  │          │ DB ││Cache││Store││ Email ││  Push    │             │
  │          └────┘└────┘└────┘└───────┘└──────────┘             │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- 🌍 **Edge-first** — Everything runs on Cloudflare's global network for sub-100ms response times worldwide
- 🗄️ **D1 (SQLite) as primary database** — 30+ tables handling users, courses, enrollments, payments, notifications, and more. D1 provides transactional consistency with automatic read replication
- ⚡ **KV as response cache** — Server configuration and frequently accessed API responses are cached in KV with 300-second TTLs, reducing D1 load significantly
- 📦 **R2 for media storage** — Videos, thumbnails, avatars, and resources are stored in R2 buckets and served via public dev URLs with 7-day browser cache headers
- 🎯 **Static SPA deployment** — Both Admin and Student apps use `output: "export"` for zero-cost static hosting on Cloudflare Pages, with client-side routing via Zustand stores

---

## 📦 Apps

### ⚡ Worker API (Backend)

The Worker is the backbone of the entire platform, built with [Hono](https://hono.dev/) — a fast, lightweight web framework optimized for Cloudflare Workers. It handles all server-side logic including authentication, database queries, file uploads, email delivery, push notifications, and payment processing.

**Location:** `worker/`

**Key features:**

| Feature | Description |
|---------|-------------|
| 🔐 **Dual authentication** | Admin auth (7-day sessions) and Student auth (30-day sessions) with separate session tables, both using Bearer tokens and SHA-256 password hashing |
| 🎛️ **Server-driven UI** | The `/api/config` endpoint serves a `ServerConfig` object controlling features, home page sections, sidebar items, bottom navigation, content protection, and card styling — all configurable without an app update |
| ⚡ **KV-cached config** | Server config cached in KV with 300-second TTL; cache auto-invalidated on admin updates |
| 📤 **R2 file serving** | Files uploaded directly to R2 buckets and served via public dev URLs or Worker proxy with 7-day cache headers |
| 🔔 **OneSignal push** | Push token registration, notification sending, and delivery logging via OneSignal REST API |
| 💳 **Payment integration** | Manual payment (bKash/Nagad), SSLCommerz, and bKash API gateways with admin-configurable activation |
| 📧 **Email via Resend** | OTP verification, password reset, and admin email campaigns |
| 🗄️ **D1 migration endpoint** | `POST /admin/migrate` creates all missing tables, columns, and indexes, and inserts seed data |

**Worker bindings:**

| Binding | Type | Resource |
|---------|------|----------|
| `DB` | D1 Database | `dakkho-admin-db` |
| `KV_CONFIG` | KV Namespace | Server config cache |
| `R2_VIDEOS` | R2 Bucket | `dakkho-videos` |
| `R2_THUMBNAILS` | R2 Bucket | `dakkho-thumbnails` |
| `R2_AVATARS` | R2 Bucket | `dakkho-avatars` |
| `R2_RESOURCES` | R2 Bucket | `dakkho-resources` |

---

### 🖥️ Admin App (Dashboard)

A single-page admin dashboard built with Next.js 16 App Router, featuring a dark glassmorphism UI theme. All **25 admin panels** communicate exclusively with the Worker API through a unified API client.

**Location:** `src/`

**Admin Panels:**

| # | Panel | Description |
|---|-------|-------------|
| 1 | 📊 **Dashboard** | System overview, live metrics, service health status |
| 2 | 👥 **Users** | User management with role-based access |
| 3 | 🏷️ **Categories** | Course categories with hierarchy support |
| 4 | 🎓 **Instructors** | Instructor profile management with R2 avatar upload |
| 5 | 📚 **Courses** | Course management with chapter and video organization |
| 6 | 🎬 **Videos** | Video management with R2 upload and streaming URLs |
| 7 | 🏛️ **Institutes** | Polytechnic institute directory management |
| 8 | ⚙️ **Config** | Server-driven UI configuration with KV broadcast |
| 9 | 🔔 **Notifications** | Push notification management and delivery via OneSignal |
| 10 | 📈 **Analytics** | Charts and data visualization with Recharts |
| 11 | 📧 **Email** | Email composition and delivery via Resend |
| 12 | 🔑 **Settings** | Service health monitoring and API key management |
| 13 | 🛡️ **Admins** | Admin user management and session control |
| 14 | 🎟️ **Coupons** | Discount coupon CRUD |
| 15 | 💰 **Discounts** | Automatic discount rules |
| 16 | 📅 **Events** | Events, holidays, and exam calendar |
| 17 | 🔴 **Live Classes** | Live class schedule management |
| 18 | 💳 **Payments** | Payment records and verification |
| 19 | 🏫 **Institute Requests** | Student-submitted institute requests |
| 20 | 📲 **Push** | Push notification token and delivery management |
| 21 | 🔧 **Technologies** | Engineering technology/department directory |
| 22 | 📦 **Packages** | Course pricing packages |
| 23 | ✅ **Enrollments** | User enrollment management |
| 24 | 🏆 **Achievements** | Achievement definitions and student achievements |
| 25 | 📖 **Subjects** | Subject management with technology association and course linking |

**API Client** (`src/lib/api-client.ts`):

- Routes all requests to `NEXT_PUBLIC_API_BASE_URL` (falls back to local `/api/admin/` if unset)
- Auto-transforms D1 `snake_case` columns to `camelCase` for frontend conventions
- Attaches Bearer token from `localStorage`
- Provides typed helpers: `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `apiUpload`, `apiRaw`

---

### 📱 Student App (Frontend)

A Netflix-like streaming application for students, built with Next.js 16 as a static SPA. It provides course browsing, video playback, progress tracking, bookmarks, achievements, social features, and 20+ polytechnic department pages.

**Location:** `dakkho-student-app/`

**Key sections:**

| Section | Features |
|---------|----------|
| 🔐 **Auth** | Login, Signup, Forgot Password, OTP verification |
| 🏠 **Home** | Hero section, continue watching, trending courses, featured instructors, category pills |
| 📚 **Courses** | My Courses, Course Detail, Curriculum, Reviews, Q&A, Resources, Notes, Quizzes, Progress, Announcements |
| 🎬 **Video** | Video player with progress tracking, downloads |
| 🎓 **Instructors** | Directory, profiles, courses, reviews, schedule, contact |
| 👤 **Profile** | Edit profile, change password, learning stats, subscription, referral, delete account |
| ⚙️ **Settings** | Account, notifications, privacy, language, theme, downloads, content protection, sessions, video quality, network data |
| 🌐 **Social** | Leaderboard, study groups, peer connections, community, feedback, roadmap |
| 📝 **Exam** | Prep, schedule, results, practice, tips |
| 🏛️ **Departments** | 20 polytechnic department pages (CSE, EEE, ME, CE, CST, etc.) |
| 📆 **Semesters** | Semester 1–8 pages |
| 🔍 **Other** | Search, bookmarks, watch history, live sessions, achievements, discussion, certificates, about, help (FAQ, terms, privacy, refund, contact), pricing, changelog |

**Zustand Stores:**

| Store | Purpose |
|-------|---------|
| `useNavigationStore` | SPA routing (page ↔ URL sync via History API) |
| `useAuthStore` | Auth state, login/signup/logout/OTP/profile |
| `useThemeStore` | Light/dark/system theme |
| `useWatchProgressStore` | Video watch progress (localStorage) |
| `useBookmarkStore` | Course bookmarks (localStorage) |
| `useNotificationStore` | In-app notifications (localStorage) |
| `useSearchStore` | Search queries + recent searches |
| `useContentProtectionStore` | Content protection toggles |
| `useServerConfigStore` | Server-driven UI config (fetched from Worker `/api/config`) |

---

## 🧰 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) App Router, Turbopack, Static Export |
| **Backend** | ![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono) on Cloudflare Workers |
| **Database** | ![D1](https://img.shields.io/badge/D1-SQLite-F38020?logo=cloudflare) Edge-replicated |
| **Cache** | ![KV](https://img.shields.io/badge/KV-Cache-F38020?logo=cloudflare) Global key-value |
| **Storage** | ![R2](https://img.shields.io/badge/R2-Storage-F38020?logo=cloudflare) S3-compatible |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss) + shadcn/ui (40+ Radix components) |
| **State Management** | Zustand |
| **Data Fetching** | TanStack React Query |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Tables** | TanStack React Table |
| **Animations** | Framer Motion |
| **Push Notifications** | OneSignal |
| **Email** | Resend |
| **Payments** | SSLCommerz, bKash API, Manual (bKash/Nagad) |
| **Hosting** | Cloudflare Pages (CDN) + Workers (Edge) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18 or **Bun** runtime
- A **Cloudflare** account with Workers, D1, KV, and R2 enabled
- **Wrangler CLI** installed (`npm install -g wrangler`)
- A **Resend** account for email delivery
- A **OneSignal** account for push notifications

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/grayrat2026/dakkho-admin.git
cd dakkho-admin

# 2. Install dependencies for all apps
npm install
cd worker && npm install && cd ..
cd dakkho-student-app && npm install && cd ..

# 3. Set up Worker secrets
cd worker
wrangler login
wrangler secret put ADMIN_SECRET_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put ONE_SIGNAL_APP_ID
wrangler secret put ONE_SIGNAL_REST_API_KEY

# 4. Deploy the Worker
wrangler deploy --config wrangler.toml

# 5. Run D1 migration (creates all tables + seed data)
curl -X POST https://dakkho-admin-api.dakkho-admin.workers.dev/admin/migrate \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"

# 6. Start Admin App development server
npm run dev

# 7. Start Student App development server
cd dakkho-student-app && npm run dev
```

### Default Admin Login

After running the migration, two default admin accounts are created:

| Email | Role |
|-------|------|
| `admin@dakkho.pro.bd` | Super Admin |
| `himadrient@proton.me` | Admin |

Set your admin password by updating the `users` table in D1, or use the migration seed defaults.

---

## 🔐 Environment Variables

### Worker (set via `wrangler secret put`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_SECRET_KEY` | ✅ Yes | Secret key for admin token generation |
| `RESEND_API_KEY` | ✅ Yes | Resend API key for email delivery |
| `ONE_SIGNAL_APP_ID` | ✅ Yes | OneSignal app ID for push notifications |
| `ONE_SIGNAL_REST_API_KEY` | ✅ Yes | OneSignal REST API key |
| `SSLCOMMERZ_STORE_ID` | ❌ No | SSLCommerz payment gateway store ID |
| `SSLCOMMERZ_STORE_PASSWORD` | ❌ No | SSLCommerz payment gateway password |
| `BKASH_USERNAME` | ❌ No | bKash API username |
| `BKASH_PASSWORD` | ❌ No | bKash API password |
| `BKASH_APP_KEY` | ❌ No | bKash API app key |
| `BKASH_APP_SECRET` | ❌ No | bKash API app secret |

### Worker (set in wrangler.toml)

| Variable | Default | Description |
|----------|---------|-------------|
| `RESEND_FROM_EMAIL` | `noreply@dakkho.pro.bd` | Default sender email |
| `RESEND_SUPPORT_EMAIL` | `support@dakkho.pro.bd` | Support email address |
| `ENVIRONMENT` | `production` | Runtime environment |

### Admin App

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ Yes | Worker API URL (e.g., `https://dakkho-admin-api.dakkho-admin.workers.dev`) |

### Student App

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | ❌ No | Worker API URL (defaults to `https://dakkho-admin-api.dakkho-admin.workers.dev`) |

---

## 📡 API Documentation

The Worker API serves two route groups: **Admin routes** (require Bearer token auth) and **Student routes** (public or student auth).

### 🔒 Admin Routes

All admin routes are prefixed with `/admin/` and require a valid `Authorization: Bearer <token>` header.

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/auth` | Admin login (email + password) |
| `GET` | `/admin/auth/check` | Verify current auth session |
| `POST` | `/admin/auth/logout` | Logout and invalidate session |
| `POST` | `/admin/auth/clear-sessions` | Clear all sessions for current admin |

#### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/system/status` | System health check (D1, KV, R2) |
| `GET/POST` | `/admin/system/api-key` | API key management |

#### Resources (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/admin/users` | List / Create users |
| `GET/POST` | `/admin/categories` | List / Create categories |
| `GET/POST` | `/admin/instructors` | List / Create instructors |
| `GET/POST` | `/admin/courses` | List / Create courses |
| `GET/POST` | `/admin/videos` | List / Create videos |
| `GET/POST` | `/admin/institutes` | List / Create institutes |
| `GET/POST` | `/admin/admin` | List / Create admin users |
| `GET/POST` | `/admin/technologies` | List / Create technologies |
| `GET/POST` | `/admin/subjects` | List / Create subjects |
| `GET/POST` | `/admin/coupons` | List / Create coupons |
| `GET/POST` | `/admin/discounts` | List / Create discounts |
| `GET/POST` | `/admin/events` | List / Create events |
| `GET/POST` | `/admin/live-classes` | List / Create live class schedules |
| `GET/POST` | `/admin/packages` | List / Create course packages |
| `GET/POST` | `/admin/enrollments` | List / Create enrollments |
| `GET/POST` | `/admin/achievements` | List / Create achievements |
| `GET/POST` | `/admin/institute-requests` | List / Review institute requests |
| `GET/POST` | `/admin/payments` | List / Manage payments |

> Individual resource routes support `PUT` and `DELETE` with an `id` query parameter.

#### Other Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/admin/config` | Read / Update server configuration |
| `GET/POST` | `/admin/notifications` | List / Send notifications |
| `GET/POST` | `/admin/push` | Push notification management |
| `GET` | `/admin/analytics` | Analytics data for charts |
| `POST` | `/admin/upload` | Upload file to Cloudflare R2 |
| `GET/POST` | `/admin/email` | Email composition and delivery |
| `POST` | `/admin/migrate` | Run D1 database migration |

### 🌐 Student Routes

Student routes are prefixed with `/api/` and may or may not require authentication.

#### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config` | Get server config (feature flags, UI settings) |
| `GET` | `/api/config/payment` | Get active payment gateway config |
| `GET` | `/api/courses` | Published course catalog |
| `GET` | `/api/instructors` | Instructor list |
| `GET` | `/api/institutes` | Institute list |
| `GET` | `/api/technologies` | Technology/department list |
| `GET` | `/api/events` | Events list |
| `GET` | `/api/live-classes` | Live class schedule |
| `POST` | `/api/coupons/validate` | Validate a coupon code |
| `GET` | `/api/course-packages` | Get packages for a course |

#### Auth Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Student signup |
| `POST` | `/api/auth/login` | Student login |
| `POST` | `/api/auth/logout` | Student logout |
| `GET` | `/api/auth/me` | Current student profile |
| `POST` | `/api/auth/verify-otp` | Verify email with OTP |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with OTP |
| `POST` | `/api/auth/resend-otp` | Resend verification OTP |
| `PUT` | `/api/auth/profile` | Update student profile |

#### Authenticated Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses/:id/videos` | Videos for enrolled course |
| `POST` | `/api/video/stream-url` | Get R2 stream URL |
| `POST` | `/api/push/register` | Register push token |
| `POST` | `/api/push/unregister` | Unregister push token |
| `POST` | `/api/payments/submit` | Submit payment |
| `GET` | `/api/packages/mine` | User's active packages |
| `POST` | `/api/institutes/requests` | Request new institute |

### File Serving

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/upload/:bucketType/:key` | Serve R2 files (7-day cache) |

Bucket types: `videos`, `thumbnails`, `avatars`, `resources`

---

## 🗄️ Database Schema

The D1 database (`dakkho-admin-db`) contains 30+ tables. Key tables include:

### Core Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| `users` | id TEXT | All users (students + admins) |
| `admin_sessions` | id TEXT | Admin auth sessions (7-day expiry) |
| `student_sessions` | id TEXT | Student auth sessions (30-day expiry) |
| `courses` | id TEXT | Course catalog |
| `videos` | id TEXT | Video records per course |
| `instructors` | id TEXT | Instructor profiles |
| `categories` | id TEXT | Course categories (with parent_id hierarchy) |
| `subjects` | id TEXT | Subjects with technology association, slug, and color |
| `enrollments` | id TEXT | User-to-course enrollment (unique user+course) |

### Course Junction Tables (Many-to-Many)

| Table | Primary Key | Description |
|-------|------------|-------------|
| `course_subjects` | id INTEGER AUTO | Links courses ↔ subjects (unique course+subject) |
| `course_categories` | id INTEGER AUTO | Links courses ↔ categories (unique course+category) |
| `course_instructors` | id INTEGER AUTO | Links courses ↔ instructors (unique course+instructor) |

### Institute & Technology Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| `institutes` | id INTEGER AUTO | Polytechnic institutes |
| `technologies` | id INTEGER AUTO | Engineering departments (CST, Civil, etc.) |
| `institute_requests` | id INTEGER AUTO | Student institute requests |

### Package & Payment Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| `course_packages` | id INTEGER AUTO | Course pricing packages |
| `user_packages` | id INTEGER AUTO | User active packages |
| `coupons` | id INTEGER AUTO | Discount coupons |
| `discounts` | id INTEGER AUTO | Automatic discount rules |
| `payments` | id INTEGER AUTO | Payment records |
| `payment_config` | id INTEGER AUTO | Payment gateway settings |

### Notification & Communication Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| `notifications` | id TEXT | In-app notifications |
| `notification_logs` | id INTEGER AUTO | Sent notification logs |
| `user_push_tokens` | id INTEGER AUTO | OneSignal push tokens |

### Config & System Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| `app_config` | key TEXT | Key-value app configuration |
| `audit_logs` | id TEXT | Admin action audit trail |
| `events` | id INTEGER AUTO | Events, holidays, exams |
| `live_class_schedules` | id INTEGER AUTO | Live class scheduling |

### User Features Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| `achievement_definitions` | id INTEGER AUTO | Achievement templates |
| `student_achievements` | id INTEGER AUTO | Unlocked achievements |
| `student_activity` | id INTEGER AUTO | Student activity log |
| `password_reset_otps` | id INTEGER AUTO | OTPs for email verification + password reset |
| `user_preferences` | user_id TEXT | Theme, privacy, content protection |
| `notification_preferences` | id INTEGER AUTO | Per-user notification settings |
| `user_2fa` | id INTEGER AUTO | 2FA settings (TOTP) |

Full schema with indexes and seed data is available in `worker/schema.sql`.

---

## 🚢 Deployment

### ⚡ Worker API

```bash
cd worker

# Deploy to Cloudflare Workers
wrangler deploy --config wrangler.toml

# Set secrets (first time only)
wrangler secret put ADMIN_SECRET_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put ONE_SIGNAL_APP_ID
wrangler secret put ONE_SIGNAL_REST_API_KEY

# Run D1 migration (first time or after schema changes)
curl -X POST https://dakkho-admin-api.dakkho-admin.workers.dev/admin/migrate \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"
```

### 🖥️ Admin App (Cloudflare Pages)

```bash
# Build static export
npm run build

# Option A: Deploy via Wrangler
npx wrangler pages deploy out --project-name=dakkho-admin

# Option B: Connect GitHub repo to Cloudflare Pages for auto-deploy
```

### 📱 Student App (Cloudflare Pages)

```bash
cd dakkho-student-app

# Build static export
npm run build

# Deploy via Wrangler
npx wrangler pages deploy out --project-name=dakkho-student
```

### Clearing KV Cache

After config changes, clear the KV cache so students see updates immediately:

```bash
wrangler kv key delete --namespace-id=<YOUR_KV_NAMESPACE_ID> --key=server_config
```

---

## 📁 Project Structure

```
dakkho-admin/
├── worker/                              # ⚡ Cloudflare Worker API (Backend)
│   ├── src/
│   │   ├── index.ts                     # Hono app entry point + route registration
│   │   ├── env.ts                       # Cloudflare bindings type interface
│   │   ├── routes/                      # Route modules
│   │   │   ├── auth.ts                  # Admin authentication
│   │   │   ├── student-auth.ts          # Student authentication
│   │   │   ├── courses.ts              # Course CRUD
│   │   │   ├── videos.ts               # Video CRUD + streaming
│   │   │   ├── instructors.ts          # Instructor CRUD
│   │   │   ├── categories.ts           # Category CRUD
│   │   │   ├── subjects.ts             # Subject CRUD + technology filter
│   │   │   ├── config.ts               # Server config (D1 + KV cache)
│   │   │   ├── upload.ts               # R2 file upload
│   │   │   ├── notifications.ts        # Notification management
│   │   │   ├── push.ts                 # OneSignal push
│   │   │   ├── email.ts                # Resend email delivery
│   │   │   ├── payments.ts             # Payment management
│   │   │   ├── coupons.ts              # Coupon CRUD
│   │   │   ├── discounts.ts            # Discount CRUD
│   │   │   ├── events.ts               # Event CRUD
│   │   │   ├── live-classes.ts         # Live class scheduling
│   │   │   ├── packages.ts             # Course package CRUD
│   │   │   ├── enrollments.ts          # Enrollment management
│   │   │   ├── achievements.ts         # Achievement definitions
│   │   │   ├── technologies.ts         # Technology/department CRUD
│   │   │   ├── institute-requests.ts   # Institute request review
│   │   │   ├── migrate.ts              # D1 migration endpoint
│   │   │   └── ...                     # System, admin, analytics, etc.
│   │   └── lib/                         # Shared library modules
│   │       ├── auth.ts                  # Auth middleware + password hashing
│   │       ├── r2.ts                    # R2 client + public URL helpers
│   │       ├── kv-cache.ts             # KV cache read/write/invalidation
│   │       ├── d1-helpers.ts            # D1 query utilities
│   │       ├── email.ts                 # Resend email templates
│   │       ├── push.ts                  # OneSignal push helpers
│   │       ├── cors.ts                  # CORS middleware
│   │       ├── transform.ts             # Response transformation (snake→camel)
│   │       └── ...                     # Error handling, validation, etc.
│   ├── schema.sql                       # Full D1 schema + seed data
│   ├── seed-polytechnics.sql            # Institute seed data
│   ├── seed-technologies.sql            # Technology seed data
│   ├── wrangler.toml                    # Worker + D1 + KV + R2 config
│   └── package.json
│
├── src/                                 # 🖥️ Admin App (Next.js 16 SPA)
│   ├── app/
│   │   ├── layout.tsx                   # Root layout with dark mode
│   │   ├── not-found.tsx               # 404 page
│   │   ├── globals.css                  # Glassmorphism theme styles
│   │   └── [[...slug]]/
│   │       ├── page.tsx                # SPA catch-all entry
│   │       └── error.tsx               # Error boundary
│   ├── components/
│   │   ├── admin/                       # 25 admin panel components
│   │   │   ├── dashboard.tsx
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── login-form.tsx
│   │   │   ├── users-table.tsx
│   │   │   ├── courses-table.tsx
│   │   │   ├── videos-table.tsx
│   │   │   ├── instructors-table.tsx
│   │   │   ├── categories-table.tsx
│   │   │   ├── subjects-table.tsx       # Subject management panel
│   │   │   ├── config-panel.tsx
│   │   │   ├── notifications-panel.tsx
│   │   │   ├── analytics-panel.tsx
│   │   │   ├── email-panel.tsx
│   │   │   ├── settings-panel.tsx
│   │   │   └── ...                     # 10 more panels
│   │   └── ui/                          # 40+ shadcn/ui components
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   └── lib/
│       ├── api-client.ts                # Unified Worker API client
│       ├── store.ts                     # Zustand global store
│       ├── constants.ts                 # App-wide constants
│       ├── types.ts                     # Shared TypeScript types
│       └── utils.ts                     # Utility functions
│
├── dakkho-student-app/                  # 📱 Student App (Next.js 16 SPA)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout
│   │   │   ├── page.tsx               # SPA entry
│   │   │   └── globals.css             # Student theme styles
│   │   ├── components/
│   │   │   ├── dakkho/                 # 80+ student pages & shared components
│   │   │   │   ├── auth/              # Login, Signup, OTP, Forgot Password
│   │   │   │   ├── home/              # Hero, Trending, Categories
│   │   │   │   ├── courses/           # Detail, Curriculum, Reviews, Progress
│   │   │   │   ├── video/             # Player, Downloads
│   │   │   │   ├── instructors/       # List, Profile, Schedule
│   │   │   │   ├── profile/           # Edit, Stats, Subscription
│   │   │   │   ├── settings/          # Account, Theme, Privacy
│   │   │   │   ├── social/            # Leaderboard, Community
│   │   │   │   ├── exam/              # Prep, Results, Practice
│   │   │   │   ├── departments/       # 20 polytechnic departments
│   │   │   │   └── ...               # Search, Bookmarks, Help, etc.
│   │   │   └── ui/                    # 40+ shadcn/ui components
│   │   ├── hooks/
│   │   └── lib/
│   │       ├── api-client.ts           # Student API client
│   │       ├── store.ts               # Zustand stores (9 stores)
│   │       ├── constants.ts
│   │       └── types.ts
│   ├── public/
│   │   ├── _headers                    # Cloudflare Pages security headers
│   │   ├── _redirects                  # SPA fallback routing
│   │   └── _routes.json               # Pages route exclusion
│   ├── next.config.ts                  # Static export config
│   └── package.json
│
├── public/                              # Admin App public assets
│   ├── dakkho-logo.png                 # DAKKHO brand logo
│   ├── logo.svg                        # SVG logo
│   ├── _headers                        # CF Pages security headers
│   ├── _redirects                       # SPA fallback
│   └── robots.txt                      # Search engine directives
│
├── prisma/
│   └── schema.prisma                   # Legacy (AdminSession only, unused)
│
├── next.config.ts                       # Admin App: static export + API URL
├── wrangler.jsonc                       # Admin App CF Pages deployment
├── Caddyfile                           # Local reverse proxy config
├── components.json                     # shadcn/ui configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
└── package.json                        # Admin App dependencies
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Development Guidelines

- ✅ Follow the existing TypeScript and Tailwind CSS conventions
- ✅ Use **Zod** schemas for all form validation
- ✅ Maintain the dark glassmorphism theme consistency in the Admin App
- ✅ Add proper error handling for all Worker API routes
- ✅ Keep components modular and reusable
- ✅ Test Worker changes locally with `wrangler dev` before deploying

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for the DAKKHO Student Streaming Platform** 🎓

</div>
