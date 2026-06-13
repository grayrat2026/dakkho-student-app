<div align="center">

# 📚 DAKKHO — Student App

**Student-facing application for the DAKKHO Online Learning Platform**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**🌐 Live:** [dakkho-student.pages.dev](https://dakkho-student.pages.dev)

</div>

---

## 📖 Overview

DAKKHO Student App is a mobile-first SPA built with Next.js 16 (static export) that provides polytechnic students in Bangladesh with access to video courses, live classes, and academic resources. The app features tokenized HLS video streaming, PipraPay/bKash/Nagad payment integration, enrollment management, progress tracking, achievements, certificates, and a full support system.

## 🔗 Related Repositories

| Repository | Description | Live URL |
|---|---|---|
| [dakkho-worker](https://github.com/grayrat2026/dakkho-worker) | Backend API (Hono + Cloudflare Workers) | [dakkho-admin-api.dakkho-admin.workers.dev](https://dakkho-admin-api.dakkho-admin.workers.dev) |
| [dakkho-instructor](https://github.com/grayrat2026/dakkho-instructor) | Instructor-facing Next.js 16 SPA | [dakkho-instructor.pages.dev](https://dakkho-instructor.pages.dev) |
| [dakkho-admin-web](https://github.com/grayrat2026/dakkho-admin-web) | Admin panel Next.js 16 SPA | [dakkho-admin.pages.dev](https://dakkho-admin.pages.dev) |

## 🏗 Architecture

- **Framework**: Next.js 16 with App Router, static export (`next export`)
- **Hosting**: Cloudflare Pages
- **State Management**: Zustand (navigation, auth, bookmarks, etc.)
- **Styling**: Tailwind CSS 4 + custom glassmorphism components
- **Animations**: Framer Motion
- **API Client**: Custom fetch wrapper with interceptors
- **Auth**: Bearer token (student_sessions) with email OTP verification

## 📱 Key Features

### Course Browsing & Enrollment
- Browse courses by department (technology), semester, and category
- Course detail page with curriculum overview, instructor info, and reviews
- Smart enrollment check — enrolled users see "Continue Learning" instead of "Enroll Now"
- Multi-package enrollment: Single, Duo/Friend Pack, Custom packages

### Payment System
- **PipraPay**: Full-page redirect to `pay.dakkho.pro.bd` (bKash, Nagad, Rocket)
- **Manual Payment**: TRX ID submission with admin verification
- Coupon code support with percentage and flat discounts
- All amounts displayed as round figures (Math.round)

### Video Streaming
- Tokenized HLS streaming with HMAC-SHA256 signed URLs
- Custom video player with progress tracking
- Watch history and resume playback
- Chapter/lesson organized curriculum

### Profile & Learning
- Student profile with institute and technology info
- Learning statistics dashboard (streak, total hours, courses)
- Achievement system with unlockable badges
- Certificate generation for completed courses

### Support
- Support ticket system with real-time messaging
- Telegram integration for admin notifications
- File attachment support via R2

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with PWA meta
│   └── [[...slug]]/page.tsx      # SPA catch-all route
├── components/
│   └── dakkho/
│       ├── DakkhoApp.tsx         # Main SPA router (route registry)
│       ├── course/               # Course pages (detail, catalog)
│       ├── profile/              # Profile, subscription, settings
│       ├── auth/                 # Login, register, OTP
│       ├── misc/                 # Payment result, about, support
│       ├── shared/               # Reusable UI components
│       ├── department/           # Department listing templates
│       └── semester/             # Semester listing templates
├── lib/
│   ├── api-client.ts             # API client (auth, courses, payments, etc.)
│   ├── store.ts                  # Zustand stores (navigation, auth, etc.)
│   ├── data-hooks.ts             # SWR data fetching hooks
│   └── mock-data.ts              # Utility functions
└── hooks/
    └── use-piprapay.ts           # PipraPay payment hook
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/grayrat2026/dakkho-student-app.git
cd dakkho-student-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build & Deploy

```bash
# Build static export
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name dakkho-student
```

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Worker API base URL (default: `https://dakkho-admin-api.dakkho-admin.workers.dev`) |

## 📋 Recent Changes (June 2026)

- **Enrollment status on course detail**: Enrolled users now see "Continue Learning" + "Enrolled ✓" badge instead of "Enroll Now — ৳XXX"
- **Payment verification by payment_id**: PaymentResultPage now verifies using `payment_id` from URL, fixing the `{pp_id}` placeholder issue
- **PipraPay natural redirect**: Full-page redirect instead of iframe for better payment gateway compatibility
- **Round figure amounts**: All prices and discounted amounts display as whole numbers (Math.round)
- **Discounted price calculation**: `getDiscountedPrice()` returns rounded values in both SubscriptionPage and CourseDetailPage

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

<p align="center">
  Built with ❤️ for the DAKKHO Platform
</p>
