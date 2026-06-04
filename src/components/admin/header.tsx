'use client';

import { usePathname } from 'next/navigation';
import { useAdminStore } from '@/lib/store';
import { apiDelete, clearAuthToken } from '@/lib/api-client';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  courses: 'Courses',
  videos: 'Videos',
  instructors: 'Instructors',
  categories: 'Categories',
  institutes: 'Institutes',
  'institute-requests': 'Institute Requests',
  coupons: 'Coupons',
  discounts: 'Discounts',
  events: 'Events & Special Days',
  'live-classes': 'Live Classes',
  payments: 'Payments',
  push: 'Push Notifications',
  notifications: 'Notifications',
  config: 'App Config',
  email: 'Email',
  analytics: 'Analytics',
  settings: 'System',
};

export default function Header() {
  const pathname = usePathname();
  const { adminUser, setAdminUser, setSidebarMobileOpen, sidebarCollapsed } = useAdminStore();
  const { toast } = useToast();

  const currentPage = (() => {
    const clean = (pathname || '').replace(/^\/+|\/+$/g, '');
    const segments = clean.split('/');
    const twoSeg = segments.length >= 2 ? `${segments[0]}-${segments[1]}` : '';
    if (pageTitles[twoSeg]) return twoSeg;
    return segments[0] || 'dashboard';
  })();
  const pageTitle = pageTitles[currentPage] || 'Dashboard';

  const handleLogout = async () => {
    try {
      await apiDelete('/auth/logout');
      clearAuthToken();
      setAdminUser(null);
      toast({ title: 'Logged out', description: 'You have been signed out' });
    } catch {
      toast({ title: 'Error', description: 'Failed to logout', variant: 'destructive' });
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.06] bg-[rgba(15,15,26,0.8)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarMobileOpen(true)}
          className="lg:hidden text-muted-foreground hover:text-white h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">DAKKHO Admin Panel</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="max-w-[180px] truncate">{adminUser?.email}</span>
        </div>
        <Avatar className="h-8 w-8 border border-dakkho-blue/30">
          <AvatarFallback className="bg-dakkho-blue/20 text-dakkho-blue text-xs font-semibold">
            {adminUser?.name?.charAt(0)?.toUpperCase() || adminUser?.email?.charAt(0)?.toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-dakkho-danger h-10 w-10"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
