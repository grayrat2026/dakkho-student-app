'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiPost, assetUrl } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '@/lib/store';
import { Loader2, X } from 'lucide-react';
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
import NotificationsPanel from '@/components/admin/notifications-panel';
import ConfigPanel from '@/components/admin/config-panel';
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
  notifications: NotificationsPanel,
  config: ConfigPanel,
  email: EmailPanel,
  analytics: AnalyticsPanel,
  settings: SettingsPanel,
};

export default function AdminShell() {
  const params = useParams();
  const { adminUser, setAdminUser, sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useAdminStore();
  const [checking, setChecking] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);

  const slug = params.slug as string[] | undefined;
  const currentPage = (slug && slug.length > 0 ? slug[0] : 'dashboard') as string;
  const router = useRouter();

  useEffect(() => {
    // Redirect root to /dashboard
    if (!slug || slug.length === 0) {
      router.replace('/dashboard');
    }
  }, [slug, router]);

  useEffect(() => {
    checkAuth();
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarMobileOpen]);

  const checkAuth = async () => {
    try {
      const data = await apiPost('/auth/check', {});
      if ((data as Record<string, unknown>).authenticated && (data as Record<string, unknown>).user) {
        setAdminUser((data as Record<string, unknown>).user as Record<string, unknown>);
      }
    } catch {
      // Not authenticated
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F1A' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center overflow-hidden">
            <img src={assetUrl('/dakkho-logo.png')} alt="DAKKHO" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading DAKKHO Admin...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!adminUser) {
    return <LoginForm />;
  }

  const PageComponent = pageComponents[currentPage] || Dashboard;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F1A' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <div className="relative h-full w-[280px]">
                <Sidebar />
                <button
                  onClick={() => setSidebarMobileOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Header />

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ paddingLeft: isDesktop ? (sidebarCollapsed ? 72 : 256) : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="pt-16 min-h-screen"
      >
        <div className="p-4 sm:p-6">
          <motion.div
            key={currentPage}
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
