'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useCourses } from '@/lib/data-hooks';
import type { Course } from '@/lib/mock-data';
import { CourseCardGrid } from '../shared/CourseCardGrid';
import { CourseCardSkeleton } from '../shared/LoadingSkeleton';

export function TrendingCourses() {
  const { data: allCourses, loading } = useCourses({ limit: 20 });

  // Featured courses or most popular as trending
  const featured = allCourses.filter((c) => c.isFeatured).slice(0, 8);
  const courses: Course[] = featured.length > 0 ? featured : allCourses.slice(0, 8);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <h2 className="text-lg font-extrabold text-foreground">Trending Courses</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-sky-500" />
        <h2 className="text-lg font-extrabold text-foreground">Trending Courses</h2>
      </div>
      <CourseCardGrid courses={courses} />
    </div>
  );
}
