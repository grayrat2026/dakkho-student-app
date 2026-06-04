'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/store';
import { assetUrl } from '@/lib/api-client';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  GraduationCap,
  Building2,
  Bell,
  Settings,
  Mail,
  BarChart3,
  Tags,
  ChevronLeft,
  ChevronRight,
  X,
  FileQuestion,
  Tag,
  Percent,
  Calendar,
  VideoIcon,
  CreditCard,
  Send,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'instructors', label: 'Instructors', icon: GraduationCap },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'institutes', label: 'Institutes', icon: Building2 },
  { id: 'technologies', label: 'Technologies', icon: Cpu },
  { id: 'institute-requests', label: 'Inst. Requests', icon: FileQuestion },
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'discounts', label: 'Discounts', icon: Percent },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'live-classes', label: 'Live Classes', icon: VideoIcon },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'push', label: 'Push Notify', icon: Send },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'config', label: 'App Config', icon: Settings },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'System', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useAdminStore();

  const currentPage = (() => {
    const clean = (pathname || '').replace(/^\/+|\/+$/g, '');
    const segments = clean.split('/');
    // Try two-segment match first (e.g., institute-requests, live-classes)
    const twoSeg = segments.length >= 2 ? `${segments[0]}-${segments[1]}` : '';
    if (navItems.some(item => item.id === twoSeg)) return twoSeg;
    const first = segments[0] || 'dashboard';
    return navItems.some(item => item.id === first) ? first : 'dashboard';
  })();

  const handleNav = (id: string) => {
    router.push(`/${id}`);
    setSidebarMobileOpen(false);
  };

  // Mobile overlay sidebar
  const mobileSidebar = (
    <AnimatePresence>
      {sidebarMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col border-r border-white/[0.06] bg-[rgba(15,15,26,0.98)] backdrop-blur-xl lg:hidden"
          >
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={assetUrl('/dakkho-logo.png')} alt="DAKKHO" className="w-7 h-7 object-contain" />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold text-white whitespace-nowrap">DAKKHO</h1>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">Admin Panel</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarMobileOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-dakkho-blue/10 text-dakkho-blue'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-mobile"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full gradient-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-dakkho-blue' : ''}`} />
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // Desktop sidebar
  const desktopSidebar = (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col border-r border-white/[0.06] bg-[rgba(15,15,26,0.95)] backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={assetUrl('/dakkho-logo.png')} alt="DAKKHO" className="w-7 h-7 object-contain" />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold text-white whitespace-nowrap">DAKKHO</h1>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">Admin Panel</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-dakkho-blue/10 text-dakkho-blue'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full gradient-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-dakkho-blue' : ''}`} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );

  return (
    <>
      {mobileSidebar}
      {desktopSidebar}
    </>
  );
}
