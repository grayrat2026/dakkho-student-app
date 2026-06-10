'use client';

import { useEffect, useState, Suspense } from 'react';
import { useUnifiedAuth } from '@/lib/unified-auth';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { assetUrl } from '@/lib/api-client';
import { UnifiedLoginPage } from './UnifiedLoginPage';

// Lazy load shells for code splitting
import dynamic from 'next/dynamic';

const StudentShell = dynamic(
  () => import('@/components/student/StudentShell').then((mod) => ({ default: mod.StudentShell })),
  { ssr: false }
);

const InstructorShell = dynamic(
  () => import('@/components/instructor/InstructorShell').then((mod) => ({ default: mod.InstructorShell })),
  { ssr: false }
);

const AdminShell = dynamic(
  () => import('@/components/admin/admin-client-page').then((mod) => ({ default: mod.default })),
  { ssr: false }
);

// Loading component
function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center overflow-hidden shadow-lg shadow-sky-500/30">
          <img src="/logo.png" alt="DAKKHO" className="w-10 h-10 object-contain rounded-xl" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading DAKKHO...</span>
        </div>
      </motion.div>
    </div>
  );
}

// Route guard logic
function isStudentRoute(pathname: string): boolean {
  const studentPrefixes = ['/', '/explore', '/search', '/notifications', '/profile', '/course',
    '/video', '/instructor', '/my-courses', '/bookmarks', '/settings', '/help',
    '/watch-history', '/downloads', '/certificates', '/live-sessions', '/achievements',
    '/assignment', '/discussion', '/about', '/department', '/semester', '/exam',
    '/community', '/category', '/pricing', '/changelog', '/maintenance', '/terms',
    '/privacy', '/error', '/login', '/signup', '/forgot-password'];
  if (pathname === '/') return true;
  return studentPrefixes.some(p => pathname.startsWith(p));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function isInstructorRoute(pathname: string): boolean {
  return pathname.startsWith('/instructor');
}

// 404 page for unauthorized access
function UnauthorizedPage({ role }: { role: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <p className="text-muted-foreground">Page not found for {role} role.</p>
      </div>
    </div>
  );
}

export function UnifiedClientPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useUnifiedAuth();
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);

  // Check auth on mount
  useEffect(() => {
    checkAuth().finally(() => setInitialized(true));
  }, [checkAuth]);

  // Toggle dark class based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'instructor') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Not authenticated = student login page (light theme)
      document.documentElement.classList.remove('dark');
    }
  }, [isAuthenticated, user]);

  // Still loading
  if (!initialized || isLoading) {
    return <LoadingShell />;
  }

  // Not authenticated → show unified login page
  if (!isAuthenticated || !user) {
    return <UnifiedLoginPage />;
  }

  // Authenticated → route based on role
  if (user.role === 'student') {
    // Students cannot access admin or instructor routes
    if (isAdminRoute(pathname) || isInstructorRoute(pathname)) {
      return <UnauthorizedPage role="student" />;
    }
    return (
      <Suspense fallback={<LoadingShell />}>
        <StudentShell />
      </Suspense>
    );
  }

  if (user.role === 'instructor') {
    // Instructors cannot access admin routes
    if (isAdminRoute(pathname)) {
      return <UnauthorizedPage role="instructor" />;
    }
    // Instructor can access instructor routes
    if (isInstructorRoute(pathname)) {
      return (
        <Suspense fallback={<LoadingShell />}>
          <InstructorShell />
        </Suspense>
      );
    }
    // Instructor accessing student routes → redirect to instructor dashboard
    // For now, just show instructor shell
    return (
      <Suspense fallback={<LoadingShell />}>
        <InstructorShell />
      </Suspense>
    );
  }

  if (user.role === 'admin') {
    // Admin can access admin routes
    if (isAdminRoute(pathname)) {
      return (
        <Suspense fallback={<LoadingShell />}>
          <AdminShell />
        </Suspense>
      );
    }
    // Admin can also access instructor routes
    if (isInstructorRoute(pathname)) {
      return (
        <Suspense fallback={<LoadingShell />}>
          <InstructorShell />
        </Suspense>
      );
    }
    // Admin accessing student routes → show admin dashboard
    return (
      <Suspense fallback={<LoadingShell />}>
        <AdminShell />
      </Suspense>
    );
  }

  // Unknown role → show login
  return <UnifiedLoginPage />;
}
