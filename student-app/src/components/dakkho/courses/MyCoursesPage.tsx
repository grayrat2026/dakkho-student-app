'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useCourses } from '@/lib/data-hooks';
import { CourseCardGrid } from '../shared/CourseCardGrid';

export function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'all'>('all');
  const { data: courses, loading, error } = useCourses();

  // For now, show all courses as available since enrollment tracking comes from the API
  const enrolledCourses = courses;

  const displayCourses = activeTab === 'all' ? enrolledCourses : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold text-red-500">Failed to load courses</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
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
          getProgress={() => 0}
        />
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {activeTab === 'in-progress' ? 'No courses in progress' : activeTab === 'completed' ? 'No completed courses yet' : 'No courses found'}
          </h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {activeTab === 'all' ? 'Enroll in courses to see them here.' : 'Keep learning to see courses here.'}
          </p>
        </div>
      )}
    </div>
  );
}
