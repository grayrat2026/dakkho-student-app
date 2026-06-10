'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Users, Calendar, Bell, Settings,
  Menu, X, LogOut, ChevronDown, HelpCircle, MessageSquare,
  BarChart3, Star, UserCircle
} from 'lucide-react';
import { useUnifiedAuth } from '@/lib/unified-auth';

// Page imports
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import VideoManager from './pages/VideoManager';
import StudentProgress from './pages/StudentProgress';
import Schedule from './pages/Schedule';
import Reviews from './pages/Reviews';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import SettingsPage from './pages/Settings';
import Analytics from './pages/Analytics';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  page: string;
}

const menuItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: BookOpen, label: 'My Courses', page: 'courses' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: Calendar, label: 'Schedule', page: 'schedule' },
  { icon: Star, label: 'Reviews', page: 'reviews' },
  { icon: Bell, label: 'Notifications', page: 'notifications' },
  { icon: MessageSquare, label: 'Support', page: 'support' },
  { icon: UserCircle, label: 'Profile', page: 'profile' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];

function InstructorPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-2xl instructor-accent flex items-center justify-center mb-4 mx-auto">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">This section is coming soon.</p>
      </motion.div>
    </div>
  );
}

function InstructorSidebarContent({
  currentPage,
  onNavigate,
  onLogout,
  collapsed,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  collapsed: boolean;
}) {
  const user = useUnifiedAuth((s) => s.user);

  // For sub-pages, highlight the parent menu item
  const activePage = currentPage.startsWith('course-detail') ? 'courses'
    : currentPage.startsWith('video-manager') ? 'courses'
    : currentPage.startsWith('student-progress') ? 'courses'
    : currentPage;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-200/20">
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-8 h-8 rounded-lg instructor-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>D</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold instructor-accent-text" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
              DAKKHO
            </span>
          )}
        </motion.div>
      </div>

      {/* User info */}
      {user && !collapsed && (
        <div className="p-4 border-b border-emerald-200/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/30">
              {user.name?.charAt(0) || 'I'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-emerald-600 truncate">Instructor</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item, i) => {
          const isActive = activePage === item.page;
          return (
            <motion.button
              key={item.page}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-200 group
                ${isActive
                  ? 'bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/5'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }
              `}
              onClick={() => onNavigate(item.page)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'group-hover:text-emerald-500'}`} />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {isActive && !collapsed && (
                <ChevronDown className="w-4 h-4 text-emerald-600 -rotate-90" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-emerald-200/20">
        <motion.button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          onClick={onLogout}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </motion.button>
      </div>
    </div>
  );
}

export function InstructorShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useUnifiedAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  // Page params for sub-pages (course-detail, video-manager, etc.)
  const [pageParams, setPageParams] = useState<Record<string, string>>({});

  // Sync from URL — lazy init to avoid effect setState
  const getPageFromPath = (): { page: string; params: Record<string, string> } => {
    if (typeof window === 'undefined') return { page: 'dashboard', params: {} };
    const path = window.location.pathname;
    const instructorPrefix = '/instructor/';
    if (path.startsWith(instructorPrefix)) {
      const raw = path.slice(instructorPrefix.length).replace(/\/+$/, '') || 'dashboard';

      // Parse compound routes like "course-detail/abc123"
      if (raw.startsWith('course-detail/')) {
        const courseId = raw.replace('course-detail/', '');
        return { page: 'course-detail', params: { courseId } };
      }
      if (raw.startsWith('video-manager/')) {
        const courseId = raw.replace('video-manager/', '');
        return { page: 'video-manager', params: { courseId } };
      }
      if (raw.startsWith('student-progress/')) {
        const courseId = raw.replace('student-progress/', '');
        return { page: 'student-progress', params: { courseId } };
      }

      return { page: raw, params: {} };
    }
    return { page: 'dashboard', params: {} };
  };

  const initial = getPageFromPath();
  const [currentPage, setCurrentPage] = useState(initial.page);

  // Resize handler
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for popstate
  useEffect(() => {
    const handlePopState = () => {
      const { page, params } = getPageFromPath();
      setCurrentPage(page);
      setPageParams(params);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: string, params?: Record<string, string>) => {
    setCurrentPage(page);
    setPageParams(params || {});

    // Build URL
    let urlPath = '/instructor/';
    if (page === 'course-detail' && params?.courseId) {
      urlPath += `course-detail/${params.courseId}`;
    } else if (page === 'video-manager' && params?.courseId) {
      urlPath += `video-manager/${params.courseId}`;
    } else if (page === 'student-progress' && params?.courseId) {
      urlPath += `student-progress/${params.courseId}`;
    } else {
      urlPath += page;
    }

    window.history.pushState({}, '', urlPath);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'courses':
        return <Courses onNavigate={handleNavigate} />;
      case 'course-detail':
        return (
          <CourseDetail
            courseId={pageParams.courseId || ''}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('courses')}
          />
        );
      case 'video-manager':
        return (
          <VideoManager
            courseId={pageParams.courseId || ''}
            onBack={() => handleNavigate('course-detail', { courseId: pageParams.courseId || '' })}
          />
        );
      case 'student-progress':
        return (
          <StudentProgress
            courseId={pageParams.courseId || ''}
            onBack={() => handleNavigate('course-detail', { courseId: pageParams.courseId || '' })}
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'schedule':
        return <Schedule />;
      case 'reviews':
        return <Reviews />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
      case 'help':
        return <InstructorPlaceholderPage title={currentPage === 'support' ? 'Support' : 'Help'} />;
      default:
        return <InstructorPlaceholderPage title={currentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-emerald-200/20">
        <div className="h-full flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <motion.button
              className="lg:hidden w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>

            {/* Desktop sidebar toggle */}
            <motion.button
              className="hidden lg:flex w-8 h-8 rounded-lg bg-muted/50 items-center justify-center"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu className="w-4 h-4 text-muted-foreground" />
            </motion.button>

            <div>
              <h1 className="text-lg font-bold instructor-accent-text" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                Instructor Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              className="relative w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('notifications')}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            <motion.button
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('profile')}
            >
              {user?.name?.charAt(0) || 'I'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed top-16 left-0 h-[calc(100vh-4rem)] z-20 bg-white/85 backdrop-blur-xl border-r border-emerald-200/20 flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        <InstructorSidebarContent
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
        />
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              className="fixed top-0 left-0 h-full w-[280px] z-50 bg-white/95 backdrop-blur-xl border-r border-emerald-200/20 shadow-2xl shadow-emerald-500/10 flex flex-col lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <InstructorSidebarContent
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                collapsed={false}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main
        className="pt-16 min-h-screen transition-all duration-200"
        style={{ paddingLeft: isDesktop ? (sidebarCollapsed ? 72 : 240) : 0 }}
      >
        <div className="p-4 md:p-6">
          <motion.div
            key={currentPage + (pageParams.courseId || '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
