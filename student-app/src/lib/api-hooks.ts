// DAKKHO React Query Hooks — Data fetching layer for student API
//
// These hooks replace direct store/mock-data usage for server state.
// Pages should migrate to these hooks one by one for real API integration.
// Client-side UI state (navigation, theme, etc.) stays in Zustand stores.
//
// Usage: const { data, isLoading, error } = useCourses({ technology: 'CSE' });
// Mutations: const enroll = useEnroll(); enroll.mutate({ courseId: 'c1' });

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  courseApi,
  enrollApi,
  bookmarkApi,
  watchProgressApi,
  settingsApi,
  statsApi,
  streakApi,
  achievementsApi,
  leaderboardApi,
  activityApi,
  notificationApi,
  profileApi,
  announcementApi,
  discussionApi,
  quizApi,
  certificateApi,
  categoryApi,
  instructorApi,
  videoApi,
  searchApi,
  configApi,
  type BookmarkItem,
  type StudentSettings,
  type QuizSubmission,
} from './api-client';

// ============ QUERY KEY FACTORY ============
// Centralized query keys for cache management and invalidation
export const queryKeys = {
  // Courses
  courses: {
    all: (params?: Record<string, string>) => ['courses', 'all', params] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
    videos: (courseId: string) => ['courses', 'videos', courseId] as const,
    enrolled: () => ['courses', 'enrolled'] as const,
  },
  // Categories & Instructors
  categories: {
    all: () => ['categories'] as const,
  },
  instructors: {
    all: () => ['instructors'] as const,
    detail: (id: string) => ['instructors', 'detail', id] as const,
  },
  // Bookmarks
  bookmarks: {
    all: () => ['bookmarks'] as const,
  },
  // Watch Progress
  watchProgress: {
    all: () => ['watchProgress', 'all'] as const,
    course: (courseId: string) => ['watchProgress', 'course', courseId] as const,
  },
  // Settings
  settings: {
    all: () => ['settings'] as const,
  },
  // Stats
  stats: {
    all: () => ['stats'] as const,
  },
  // Streak
  streak: {
    current: () => ['streak', 'current'] as const,
    calendar: () => ['streak', 'calendar'] as const,
  },
  // Achievements
  achievements: {
    all: () => ['achievements'] as const,
  },
  // Leaderboard
  leaderboard: {
    all: (params?: Record<string, string>) => ['leaderboard', params] as const,
  },
  // Activity
  activity: {
    all: () => ['activity'] as const,
  },
  // Notifications
  notifications: {
    all: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },
  // Profile
  profile: {
    all: () => ['profile'] as const,
  },
  // Announcements
  announcements: {
    all: (limit?: number) => ['announcements', limit] as const,
  },
  // Discussions
  discussions: {
    all: (courseId?: string) => ['discussions', courseId] as const,
  },
  // Quizzes
  quizzes: {
    course: (courseId: string) => ['quizzes', 'course', courseId] as const,
  },
  // Certificates
  certificates: {
    all: () => ['certificates'] as const,
  },
  // Config
  config: {
    all: () => ['config'] as const,
  },
  // Video
  video: {
    stream: (videoId: string) => ['video', 'stream', videoId] as const,
  },
  // Search
  search: {
    query: (q: string) => ['search', q] as const,
  },
} as const;

// ============ COURSE HOOKS ============

interface CourseListParams {
  technology?: string;
  category?: string;
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useCourses(params?: CourseListParams) {
  const paramString = JSON.stringify(params);
  return useQuery({
    queryKey: queryKeys.courses.all(params ? JSON.parse(paramString) : undefined),
    queryFn: () => courseApi.list(params),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => courseApi.get(id),
    enabled: !!id,
  });
}

export function useCourseVideos(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courses.videos(courseId),
    queryFn: () => courseApi.videos(courseId),
    enabled: !!courseId,
  });
}

export function useEnrolledCourses() {
  return useQuery({
    queryKey: queryKeys.courses.enrolled(),
    queryFn: () => courseApi.enrolled(),
  });
}

// ============ CATEGORY / INSTRUCTOR HOOKS ============

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => categoryApi.list(),
  });
}

export function useInstructors() {
  return useQuery({
    queryKey: queryKeys.instructors.all(),
    queryFn: () => instructorApi.list(),
  });
}

export function useInstructor(id: string) {
  return useQuery({
    queryKey: queryKeys.instructors.detail(id),
    queryFn: () => instructorApi.get(id),
    enabled: !!id,
  });
}

// ============ BOOKMARK HOOKS ============

export function useBookmarks() {
  return useQuery({
    queryKey: queryKeys.bookmarks.all(),
    queryFn: () => bookmarkApi.list(),
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => bookmarkApi.add(courseId),
    // Optimistic update
    onMutate: async (courseId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks.all() });
      const previous = queryClient.getQueryData(queryKeys.bookmarks.all());

      queryClient.setQueryData(queryKeys.bookmarks.all(), (old: { bookmarks: BookmarkItem[] } | undefined) => {
        if (!old) return old;
        return {
          bookmarks: [
            ...old.bookmarks,
            {
              id: `temp-${courseId}`,
              courseId,
              courseTitle: '',
              thumbnailUrl: '',
              addedAt: new Date().toISOString(),
            },
          ],
        };
      });

      return { previous };
    },
    onError: (_err, _courseId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.bookmarks.all(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all() });
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => bookmarkApi.remove(courseId),
    // Optimistic update
    onMutate: async (courseId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks.all() });
      const previous = queryClient.getQueryData(queryKeys.bookmarks.all());

      queryClient.setQueryData(queryKeys.bookmarks.all(), (old: { bookmarks: BookmarkItem[] } | undefined) => {
        if (!old) return old;
        return {
          bookmarks: old.bookmarks.filter((b) => b.courseId !== courseId),
        };
      });

      return { previous };
    },
    onError: (_err, _courseId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.bookmarks.all(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all() });
    },
  });
}

// ============ ENROLLMENT HOOKS ============

export function useEnroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => enrollApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrolled() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all() });
    },
  });
}

// ============ NOTIFICATION HOOKS ============

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: () => notificationApi.list(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationApi.unreadCount(),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}

// ============ PROFILE HOOKS ============

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all(),
    queryFn: () => profileApi.get(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; institute?: string; technology?: string }) =>
      profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all() });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all() });
    },
  });
}

// ============ SETTINGS HOOKS ============

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => settingsApi.get(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<StudentSettings>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
    },
  });
}

// ============ WATCH PROGRESS HOOKS ============

export function useWatchProgress(courseId: string) {
  return useQuery({
    queryKey: queryKeys.watchProgress.course(courseId),
    queryFn: () => watchProgressApi.get(courseId),
    enabled: !!courseId,
  });
}

export function useAllWatchProgress() {
  return useQuery({
    queryKey: queryKeys.watchProgress.all(),
    queryFn: () => watchProgressApi.list(),
  });
}

export function useUpdateWatchProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      videoId: string;
      courseId: string;
      lastPosition: number;
      progress: number;
      completed: boolean;
    }) => watchProgressApi.update(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchProgress.course(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchProgress.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all() });
    },
  });
}

// ============ STATS / STREAK / ACHIEVEMENTS HOOKS ============

export function useLearningStats() {
  return useQuery({
    queryKey: queryKeys.stats.all(),
    queryFn: () => statsApi.get(),
  });
}

export function useStreak() {
  return useQuery({
    queryKey: queryKeys.streak.current(),
    queryFn: () => streakApi.get(),
  });
}

export function useStreakCalendar() {
  return useQuery({
    queryKey: queryKeys.streak.calendar(),
    queryFn: () => streakApi.calendar(),
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.achievements.all(),
    queryFn: () => achievementsApi.list(),
  });
}

interface LeaderboardParams {
  period?: string;
  limit?: number;
}

export function useLeaderboard(params?: LeaderboardParams) {
  const paramString = JSON.stringify(params);
  return useQuery({
    queryKey: queryKeys.leaderboard.all(params ? JSON.parse(paramString) : undefined),
    queryFn: () => leaderboardApi.list(params),
  });
}

export function useActivityLog() {
  return useQuery({
    queryKey: queryKeys.activity.all(),
    queryFn: () => activityApi.list(),
  });
}

// ============ SEARCH HOOK ============

export function useSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: () => searchApi.search(query),
    enabled: !!query && query.length >= 2,
  });
}

// ============ ANNOUNCEMENTS HOOK ============

export function useAnnouncements(limit?: number) {
  return useQuery({
    queryKey: queryKeys.announcements.all(limit),
    queryFn: () => announcementApi.list(limit),
  });
}

// ============ DISCUSSION HOOKS ============

export function useDiscussions(courseId?: string) {
  return useQuery({
    queryKey: queryKeys.discussions.all(courseId),
    queryFn: () => discussionApi.list(courseId),
  });
}

export function useCreateDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { courseId: string; title: string; content: string }) =>
      discussionApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discussions.all(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discussions.all() });
    },
  });
}

export function useReplyDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ discussionId, content }: { discussionId: string; content: string }) =>
      discussionApi.reply(discussionId, content),
    onSuccess: () => {
      // Invalidate all discussion queries since we don't know which one was replied to
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

// ============ QUIZ HOOKS ============

export function useQuiz(courseId: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.course(courseId),
    queryFn: () => quizApi.get(courseId),
    enabled: !!courseId,
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuizSubmission) => quizApi.submit(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.course(variables.quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all() });
    },
  });
}

// ============ CERTIFICATE HOOKS ============

export function useCertificates() {
  return useQuery({
    queryKey: queryKeys.certificates.all(),
    queryFn: () => certificateApi.list(),
  });
}

export function useGenerateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => certificateApi.generate(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all() });
    },
  });
}

// ============ CONFIG HOOK ============

export function useServerConfig() {
  return useQuery({
    queryKey: queryKeys.config.all(),
    queryFn: () => configApi.get(),
    staleTime: 10 * 60 * 1000, // Config changes rarely
  });
}

// ============ VIDEO STREAM HOOK ============

export function useVideoStream(videoId: string) {
  return useQuery({
    queryKey: queryKeys.video.stream(videoId),
    queryFn: () => videoApi.stream(videoId),
    enabled: !!videoId,
  });
}
