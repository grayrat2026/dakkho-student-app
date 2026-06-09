'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useCourses } from '@/lib/data-hooks';
import { packageApi } from '@/lib/api-client';
import type { UserPackage } from '@/lib/api-client';
import { useWatchProgressStore, useAuthStore } from '@/lib/store';
import { CourseCardGrid } from '../shared/CourseCardGrid';

interface EnrolledCourseInfo {
  courseId: string;
  progress: number; // 0–100
}

export function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'all'>('all');
  const { data: courses, loading: coursesLoading, error: coursesError } = useCourses();
  const { isAuthenticated } = useAuthStore();
  const watchProgress = useWatchProgressStore((s) => s.progress);

  const [myPackages, setMyPackages] = useState<UserPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  // Fetch the user's active packages to determine enrolled courses
  const fetchMyPackages = useCallback(async () => {
    if (!isAuthenticated) {
      setPackagesLoading(false);
      return;
    }
    setPackagesLoading(true);
    try {
      const res = await packageApi.mine();
      setMyPackages(res.packages || []);
    } catch {
      setMyPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMyPackages();
  }, [fetchMyPackages]);

  // Derive enrolled course IDs from active packages
  const enrolledCourseIds = new Set(
    myPackages
      .filter((p) => p.status === 'active')
      .map((p) => p.course_id)
  );

  // Also include courses that have any watch progress (for free courses)
  const coursesWithProgress = new Set<string>();
  for (const wp of Object.values(watchProgress)) {
    coursesWithProgress.add(wp.courseId);
  }

  // A course is "enrolled" if the user has an active package OR has watch progress
  const isEnrolled = (courseId: string) =>
    enrolledCourseIds.has(courseId) || coursesWithProgress.has(courseId);

  // Filter to only enrolled courses
  const enrolledCourses = courses.filter((c) => isEnrolled(c.id));

  // Compute per-course progress from watch progress store
  const getCourseProgress = (courseId: string): number => {
    const courseVideos = Object.values(watchProgress).filter(
      (wp) => wp.courseId === courseId
    );
    if (courseVideos.length === 0) return 0;
    const totalProgress = courseVideos.reduce((sum, wp) => sum + wp.progress, 0);
    return Math.round(totalProgress / courseVideos.length);
  };

  // Build enrolled course info list
  const enrolledCourseInfos: EnrolledCourseInfo[] = enrolledCourses.map((c) => ({
    courseId: c.id,
    progress: getCourseProgress(c.id),
  }));

  // Filter by tab
  const displayCourses = (() => {
    switch (activeTab) {
      case 'in-progress':
        return enrolledCourses.filter((c) => {
          const info = enrolledCourseInfos.find((i) => i.courseId === c.id);
          return info && info.progress > 0 && info.progress < 100;
        });
      case 'completed':
        return enrolledCourses.filter((c) => {
          const info = enrolledCourseInfos.find((i) => i.courseId === c.id);
          return info && info.progress >= 100;
        });
      case 'all':
      default:
        return enrolledCourses;
    }
  })();

  const loading = coursesLoading || packagesLoading;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading your courses...</p>
      </div>
    );
  }

  if (coursesError) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold text-red-500">Failed to load courses</p>
        <p className="text-sm text-muted-foreground mt-2">{coursesError}</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-foreground mb-2">My Courses</h1>
        <p className="text-sm text-muted-foreground mb-6">Track your learning progress</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/30 rounded-xl p-1">
        {[
          { key: 'all' as const, label: 'All', icon: BookOpen },
          { key: 'in-progress' as const, label: 'In Progress', icon: Clock },
          { key: 'completed' as const, label: 'Completed', icon: CheckCircle },
        ].map((tab) => (
          <motion.button
            key={tab.key}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-600 dark:text-sky-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.key)}
            whileTap={{ scale: 0.97 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Course grid */}
      {displayCourses.length > 0 ? (
        <CourseCardGrid
          courses={displayCourses}
          showProgress
          getProgress={(courseId: string) => getCourseProgress(courseId)}
        />
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {activeTab === 'in-progress' ? 'No courses in progress' : activeTab === 'completed' ? 'No completed courses yet' : enrolledCourses.length === 0 ? 'No enrolled courses yet' : 'No courses found'}
          </h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {activeTab === 'all' && enrolledCourses.length === 0
              ? 'Enroll in courses to see them here.'
              : 'Keep learning to see courses here.'}
          </p>
        </div>
      )}
    </div>
  );
}
