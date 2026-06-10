'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/store';
import { assetUrl } from '@/lib/api-client';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  School,
  Building2,
  Bell,
  Settings,
  Mail,
  BarChart3,
  Tags,
  X,
  FileQuestion,
  Tag,
  Percent,
  Calendar,
  VideoIcon,
  CreditCard,
  Send,
  Cpu,
  Package,
  Award,
  GraduationCap,
  Radio,
  PanelLeftClose,
  PanelLeft,
  Info,
  Headphones,
  BookMarked,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Navigation structure — grouped into labeled sections
// ---------------------------------------------------------------------------

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Content',
    items: [
      { id: 'courses', label: 'Courses', icon: BookOpen },
      { id: 'videos', label: 'Videos', icon: Video },
      { id: 'instructors', label: 'Instructors', icon: School },
      { id: 'categories', label: 'Categories', icon: Tags },
      { id: 'about', label: 'About Page', icon: Info },
    ],
  },
  {
    title: 'Users & Institutes',
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'institutes', label: 'Institutes', icon: Building2 },
      { id: 'technologies', label: 'Technologies', icon: Cpu },
      { id: 'subjects', label: 'Subjects', icon: BookMarked },
      { id: 'institute-requests', label: 'Inst. Requests', icon: FileQuestion },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { id: 'coupons', label: 'Coupons', icon: Tag },
      { id: 'discounts', label: 'Discounts', icon: Percent },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'packages', label: 'Packages', icon: Package },
      { id: 'enrollments', label: 'Enrollments', icon: GraduationCap },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'live-classes', label: 'Live Classes', icon: VideoIcon },
      { id: 'support', label: 'Support', icon: Headphones },
      { id: 'push', label: 'Push Notify', icon: Send },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'achievements', label: 'Achievements', icon: Award },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'config', label: 'App Config', icon: Settings },
      { id: 'email', label: 'Email', icon: Mail },
      { id: 'settings', label: 'System', icon: Radio },
    ],
  },
];

// Flat list of all ids for page detection
const allNavIds = navSections.flatMap((s) => s.items.map((i) => i.id));

// ---------------------------------------------------------------------------
// Helper: detect current page from pathname
// ---------------------------------------------------------------------------

function detectCurrentPage(pathname: string): string {
  const clean = (pathname || '').replace(/^\/+|\/+$/g, '');
  const segments = clean.split('/');
  // Try two-segment match first (e.g., institute-requests, live-classes)
  const twoSeg = segments.length >= 2 ? `${segments[0]}-${segments[1]}` : '';
  if (allNavIds.includes(twoSeg)) return twoSeg;
  const first = segments[0] || 'dashboard';
  return allNavIds.includes(first) ? first : 'dashboard';
}

// ---------------------------------------------------------------------------
// Shared: nav item renderer
// ---------------------------------------------------------------------------

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  layoutId: string;
  onClick: () => void;
}

function NavItemButton({ item, isActive, collapsed, layoutId, onClick }: NavItemButtonProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
        isActive
          ? 'bg-blue-500/[0.08] text-blue-400'
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
      }`}
      title={collapsed ? item.label : undefined}
    >
      {/* Active gradient indicator bar */}
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{
            background: 'linear-gradient(180deg, #4A90E2 0%, #00D4AA 100%)',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      <Icon
        className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200 ${
          isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
        }`}
      />

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
        >
          {item.label}
        </motion.span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section label component
// ---------------------------------------------------------------------------

function SectionLabel({ title, collapsed }: { title: string; collapsed: boolean }) {
  if (collapsed) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="px-3 pt-5 pb-1.5"
    >
      <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-500/70 select-none">
        {title}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Collapsed separator dot for section boundaries
// ---------------------------------------------------------------------------

function CollapsedSeparator() {
  return (
    <div className="flex justify-center py-2">
      <div className="w-1 h-1 rounded-full bg-white/[0.08]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logo component
// ---------------------------------------------------------------------------

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Gradient-bordered circle with logo */}
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full p-[2px]"
          style={{
            background: 'linear-gradient(135deg, #4A90E2 0%, #00D4AA 100%)',
          }}
        >
          <div className="w-full h-full rounded-full bg-[#0a0a18] flex items-center justify-center overflow-hidden">
            <img
              src={assetUrl('/dakkho-logo.png')}
              alt="DAKKHO"
              className="w-6 h-6 object-contain"
            />
          </div>
        </div>
      </div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <h1 className="text-[17px] font-bold text-white whitespace-nowrap tracking-tight">
            DAKKHO
          </h1>
          <p className="text-[10px] text-slate-500 whitespace-nowrap font-medium">
            Admin Panel
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar Component
// ---------------------------------------------------------------------------

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } =
    useAdminStore();

  const currentPage = detectCurrentPage(pathname || '');

  const handleNav = (id: string) => {
    router.push(`/${id}`);
    setSidebarMobileOpen(false);
  };

  // ── Mobile overlay sidebar ──────────────────────────────────────────────
  const mobileSidebar = (
    <AnimatePresence>
      {sidebarMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />

          {/* Slide-in panel */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col border-r border-white/[0.05] lg:hidden"
            style={{ background: 'rgba(10, 10, 24, 0.97)', backdropFilter: 'blur(24px)' }}
          >
            {/* Logo header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.05]">
              <SidebarLogo collapsed={false} />
              <button
                onClick={() => setSidebarMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
              {navSections.map((section) => (
                <div key={section.title}>
                  <SectionLabel title={section.title} collapsed={false} />
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavItemButton
                        key={item.id}
                        item={item}
                        isActive={currentPage === item.id}
                        collapsed={false}
                        layoutId="sidebar-active-mobile"
                        onClick={() => handleNav(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // ── Desktop sidebar ─────────────────────────────────────────────────────
  const desktopSidebar = (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col border-r border-white/[0.05]"
      style={{ background: 'rgba(10, 10, 24, 0.97)', backdropFilter: 'blur(24px)' }}
    >
      {/* Logo header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-white/[0.05]">
        <SidebarLogo collapsed={sidebarCollapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={section.title}>
            {sIdx > 0 && sidebarCollapsed && <CollapsedSeparator />}
            <SectionLabel title={section.title} collapsed={sidebarCollapsed} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemButton
                  key={item.id}
                  item={item}
                  isActive={currentPage === item.id}
                  collapsed={sidebarCollapsed}
                  layoutId="sidebar-active"
                  onClick={() => handleNav(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-white/[0.05]">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div
            initial={false}
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </motion.div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[13px] font-medium"
            >
              Collapse
            </motion.span>
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
