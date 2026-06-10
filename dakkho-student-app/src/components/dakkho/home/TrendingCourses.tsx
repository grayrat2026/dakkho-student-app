'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { type Course, courseApi } from '@/lib/api-client';
import { CourseCardGrid } from '../shared/CourseCardGrid';

export function TrendingCourses() {
  const [trending, setTrending] = useState<Course[]>([]);

  useEffect(() => {
    courseApi.list({ limit: 20 }).then((res) => {
      setTrending(res.courses.filter((c) => c.isFeatured).slice(0, 8));
    }).catch(() => {});
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-sky-500" />
        <h2 className="text-lg font-extrabold text-foreground">Trending Courses</h2>
      </div>
      <CourseCardGrid courses={trending} />
    </div>
  );
}
