'use client';

import { useState, useEffect } from 'react';
import { apiPost, assetUrl } from '@/lib/api-client';
import ErrorBoundary from '@/components/admin/error-boundary';
import { motion } from 'framer-motion';
import { useAdminStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import LoginForm from '@/components/admin/login-form';
import Sidebar from '@/components/admin/sidebar';
import Header from '@/components/admin/header';
import Dashboard from '@/components/admin/dashboard';
import UsersTable from '@/components/admin/users-table';
import CoursesTable from '@/components/admin/courses-table';
import VideosTable from '@/components/admin/videos-table';
import InstructorsTable from '@/components/admin/instructors-table';
import CategoriesTable from '@/components/admin/categories-table';
import InstitutesTable from '@/components/admin/institutes-table';
import TechnologiesTable from '@/components/admin/technologies-table';
import SubjectsTable from '@/components/admin/subjects-table';
import InstituteRequests from '@/components/admin/institute-requests';
import CouponsPanel from '@/components/admin/coupons-panel';
import DiscountsPanel from '@/components/admin/discounts-panel';
import PaymentsPanel from '@/components/admin/payments-panel';
import PackagesPanel from '@/components/admin/packages-panel';
import EnrollmentsPanel from '@/components/admin/enrollments-panel';
import EventsPanel from '@/components/admin/events-panel';
import LiveClassesPanel from '@/components/admin/live-classes-panel';
import AchievementsPanel from '@/components/admin/achievements-panel';
import PushPanel from '@/components/admin/push-panel';
import NotificationsPanel from '@/components/admin/notifications-panel';
import ConfigPanel from '@/components/admin/config-panel';
import AboutPanel from '@/components/admin/about-panel';
import SupportPanel from '@/components/admin/support-panel';
import EmailPanel from '@/components/admin/email-panel';
import AnalyticsPanel from '@/components/admin/analytics-panel';
import SettingsPanel from '@/components/admin/settings-panel';

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  users: UsersTable,
  courses: CoursesTable,
  videos: VideosTable,
  instructors: InstructorsTable,
  categories: CategoriesTable,
  institutes: InstitutesTable,
  technologies: TechnologiesTable,
  subjects: SubjectsTable,
  'institute-requests': InstituteRequests,
  coupons: CouponsPanel,
  discounts: DiscountsPanel,
  payments: PaymentsPanel,
  packages: PackagesPanel,
  enrollments: EnrollmentsPanel,
  events: EventsPanel,
  'live-classes': LiveClassesPanel,
  achievements: AchievementsPanel,
  push: PushPanel,
  notifications: NotificationsPanel,
  config: ConfigPanel,
  about: AboutPanel,
  support: SupportPanel,
  email: EmailPanel,
  analytics: AnalyticsPanel,
  settings: SettingsPanel,
};

const validPages = Object.keys(pageComponents);

export default function AdminClientPage({ currentPage: initialPage }: { currentPage: string }) {
  const { adminUser, setAdminUser, sidebarCollapsed } = useAdminStore();
  const [checking, setChecking] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const getPageFromPath = (pathname: string): string => {
    const clean = pathname.replace(/^\/+|\/+$/g, '');
    const segments = clean.split('/');
    const twoSegment = segments.length >= 2 ? `${segments[0]}-${segments[1]}` : '';
    if (validPages.includes(twoSegment)) return twoSegment;
    const firstSegment = segments[0] || 'dashboard';
    return validPages.includes(firstSegment) ? firstSegment : 'dashboard';
  };

  useEffect(() => {
    setCurrentPage(validPages.includes(initialPage) ? initialPage : 'dashboard');
  }, [initialPage]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setCurrentPage(getPageFromPath(window.location.pathname));
  }, []);

  useEffect(() => {
    checkAuth();
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAuth = async () => {
    try {
      const authPromise = apiPost('/auth/check', {});
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timed out')), 8000)
      );

      const data = await Promise.race([authPromise, timeoutPromise]);

      if ((data as Record<string, unknown>).authenticated && (data as Record<string, unknown>).user) {
        setAdminUser((data as Record<string, unknown>).user as Record<string, unknown>);
      }
    } catch (err) {
      // Not authenticated or API unreachable — show login form
      console.warn('[checkAuth] Auth check failed:', err instanceof Error ? err.message : String(err));
    } finally {
      setChecking(false);
    }
  };

  let content: React.ReactNode;

  if (checking) {
    content = (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#090918' }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-dakkho-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-dakkho-teal/3 rounded-full blur-3xl" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center overflow-hidden shadow-lg shadow-dakkho-blue/20"
          >
            <img src={assetUrl('/dakkho-logo.png')} alt="DAKKHO" className="w-10 h-10 object-contain" />
          </motion.div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading DAKKHO Admin...</span>
          </div>
        </motion.div>
      </div>
    );
  } else if (!adminUser) {
    content = <LoginForm />;
  } else {
    const pageKey = validPages.includes(currentPage) ? currentPage : 'dashboard';
    const PageComponent = pageComponents[pageKey] || Dashboard;

    content = (
      <div className="min-h-screen relative" style={{ background: '#090918' }}>
        {/* Ambient background glows */}
        <div className="ambient-glow ambient-glow-blue" />
        <div className="ambient-glow ambient-glow-teal" />

        <Sidebar />
        <Header />
        <motion.main
          initial={false}
          animate={{ paddingLeft: isDesktop ? (sidebarCollapsed ? 72 : 256) : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="pt-16 min-h-screen relative z-10"
        >
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <motion.div
              key={pageKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PageComponent />
            </motion.div>
          </div>
        </motion.main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {content}
    </ErrorBoundary>
  );
}
