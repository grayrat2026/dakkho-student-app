// Custom hooks for fetching data from the real API
// These replace the synchronous mock-data lookups (getCourse, getInstructor, etc.)

import { useState, useEffect } from 'react';
import {
  type Course, type Instructor, type Category, type Video,
  courseApi, instructorApi, categoryApi,
} from './api-client';

// Generic async data fetch hook
function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load data');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// Course hooks
export function useCourse(courseId: string | undefined) {
  return useAsyncData<{ course: Course }>(
    () => courseApi.get(courseId!),
    [courseId]
  );
}

export function useCourseVideos(courseId: string | undefined) {
  return useAsyncData<{ videos: Video[]; total: number }>(
    () => courseApi.videos(courseId!),
    [courseId]
  );
}

export function useCourses(params?: { technology?: string; limit?: number; offset?: number }) {
  return useAsyncData<{ courses: Course[]; total: number }>(
    () => courseApi.list(params),
    [params?.technology, params?.limit, params?.offset]
  );
}

// Instructor hooks
export function useInstructor(instructorId: string | undefined) {
  return useAsyncData<{ instructor: Instructor }>(
    () => instructorApi.get(instructorId!),
    [instructorId]
  );
}

export function useInstructors(params?: { search?: string; limit?: number; offset?: number }) {
  return useAsyncData<{ instructors: Instructor[]; total: number }>(
    () => instructorApi.list(params),
    [params?.search, params?.limit, params?.offset]
  );
}

export function useInstructorCourses(instructorId: string | undefined) {
  return useAsyncData<{ courses: Course[] }>(
    () => instructorApi.courses(instructorId!),
    [instructorId]
  );
}

// Category hooks
export function useCategories() {
  return useAsyncData<{ categories: Category[] }>(
    () => categoryApi.list(),
    []
  );
}

// Fetch multiple courses by IDs (for bookmarks, enrollments, etc.)
export function useCoursesByIds(ids: string[]) {
  return useAsyncData<{ courses: Course[]; total: number }>(
    async () => {
      const res = await courseApi.list({ limit: 200 });
      const filtered = res.courses.filter(c => ids.includes(c.id));
      return { courses: filtered, total: filtered.length };
    },
    [ids.join(',')]
  );
}
