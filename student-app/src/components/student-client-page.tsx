"use client";

import { useState, useEffect, useRef } from "react";
import { useStudentStore } from "@/lib/store";
import LoginForm from "@/components/student/login-form";
import StudentLayout from "@/components/student/student-layout";
import HomePage from "@/components/student/home-page";
import ProfilePage from "@/components/student/profile-page";
import EditProfilePage from "@/components/student/edit-profile-page";
import NotificationsPage from "@/components/student/notifications-page";
import CoursesPage from "@/components/student/courses-page";
import CourseDetailPage from "@/components/student/course-detail-page";
import MyCoursesPage from "@/components/student/my-courses-page";
import SettingsPage from "@/components/student/settings-page";
import BookmarksPage from "@/components/student/bookmarks-page";
import { Loader2 } from "lucide-react";

const pageComponents: Record<string, React.ComponentType<{ onNavigate: (page: string, data?: Record<string, string>) => void }>> = {
  home: HomePage,
  profile: ProfilePage,
  "profile/edit": EditProfilePage,
  notifications: NotificationsPage,
  courses: CoursesPage,
  "courses/detail": CourseDetailPage,
  "my-courses": MyCoursesPage,
  settings: SettingsPage,
  bookmarks: BookmarksPage,
};

const validPages = Object.keys(pageComponents);

function getPageFromPath(pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  const path = clean || "home";
  if (validPages.includes(path)) return path;
  const firstSegment = path.split("/")[0];
  if (validPages.includes(firstSegment)) return firstSegment;
  return "home";
}

function getInitialPage(): string {
  if (typeof window === "undefined") return "home";
  return getPageFromPath(window.location.pathname);
}

export default function StudentClientPage() {
  const { studentUser, setStudentUser } = useStudentStore();
  const [checking, setChecking] = useState(true);
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const hasCheckedAuth = useRef(false);

  const doCheckAuth = async () => {
    try {
      // Check for token from URL parameter (admin "Login As User" feature)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        // Store the token and clean the URL
        localStorage.setItem('dakkho_student_token', urlToken);
        window.history.replaceState({}, '', '/');
      }

      const token = localStorage.getItem("dakkho_student_token");
      if (!token) {
        setChecking(false);
        return;
      }
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const res = await fetch(`${API_BASE}/student/auth/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setStudentUser(data.user);
      } else {
        localStorage.removeItem("dakkho_student_token");
      }
    } catch {
      localStorage.removeItem("dakkho_student_token");
    } finally {
      setChecking(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      doCheckAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for URL popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (page: string) => {
    const pageKey = validPages.includes(page) ? page : "home";
    setCurrentPage(pageKey);
    window.history.pushState({}, "", `/${pageKey === "home" ? "" : pageKey}`);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F1A" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading DAKKHO...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!studentUser) {
    return <LoginForm onLogin={doCheckAuth} />;
  }

  const pageKey = validPages.includes(currentPage) ? currentPage : "home";
  const PageComponent = pageComponents[pageKey] || HomePage;

  return (
    <StudentLayout currentPage={currentPage} onNavigate={navigate}>
      <PageComponent onNavigate={navigate} />
    </StudentLayout>
  );
}
