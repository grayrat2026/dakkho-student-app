"use client";

import { useStudentStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  BookOpen,
  GraduationCap,
  Bell,
  User,
  Settings,
  Bookmark,
  LogOut,
} from "lucide-react";
import { clearAuthToken } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface StudentLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const bottomNavItems = [
  { key: "home", label: "Home", icon: Home },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "my-courses", label: "My Learning", icon: GraduationCap },
  { key: "profile", label: "Profile", icon: User },
];

const sidebarMenuItems = [
  { key: "home", label: "Home", icon: Home },
  { key: "courses", label: "Course Catalog", icon: BookOpen },
  { key: "my-courses", label: "My Learning", icon: GraduationCap },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function StudentLayout({ children, currentPage, onNavigate }: StudentLayoutProps) {
  const { studentUser, setStudentUser, unreadCount } = useStudentStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = () => {
    clearAuthToken();
    setStudentUser(null);
    toast.success("Logged out successfully");
  };

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setSheetOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F0F1A" }}>
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-white">D</span>
                  </div>
                  <span className="text-lg font-bold gradient-text hidden sm:inline">DAKKHO</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-[#0F0F1A] border-white/10 p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <span className="text-lg font-bold text-white">D</span>
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">DAKKHO</div>
                      <div className="text-xs text-muted-foreground">Learning Platform</div>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* User Info */}
                <div className="px-6 pb-4">
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={studentUser?.avatarUrl} />
                        <AvatarFallback className="gradient-primary text-white text-sm">
                          {studentUser?.name ? getInitials(studentUser.name) : "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {studentUser?.name || "Student"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {studentUser?.email || ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Menu Items */}
                <nav className="p-4 space-y-1">
                  {sidebarMenuItems.map((item) => {
                    const isActive = currentPage === item.key || (item.key === "notifications" && currentPage === "notifications");
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavigate(item.key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                          isActive
                            ? "gradient-primary text-white shadow-lg"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.key === "notifications" && unreadCount > 0 && (
                          <Badge className="ml-auto h-5 min-w-[20px] px-1 text-xs gradient-primary text-white border-0">
                            {unreadCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <Separator className="bg-white/5" />

                <div className="p-4">
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => onNavigate("notifications")}
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 gradient-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => onNavigate("profile")}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8 ring-2 ring-white/10">
                <AvatarImage src={studentUser?.avatarUrl} />
                <AvatarFallback className="gradient-primary text-white text-xs">
                  {studentUser?.name ? getInitials(studentUser.name) : "S"}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
          {bottomNavItems.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all ${
                  isActive ? "text-white" : "text-muted-foreground hover:text-white/70"
                }`}
              >
                <div className={`p-1 rounded-lg transition-all ${isActive ? "gradient-primary" : ""}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "gradient-text" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}
