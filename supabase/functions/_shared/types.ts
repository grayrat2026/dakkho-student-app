// Shared type definitions for DAKKHO Admin Panel Edge Functions

export interface AppwriteUser {
  $id: string;
  email: string;
  fullName: string;
  institute?: string;
  technology?: string;
  avatarUrl?: string;
  role: 'student' | 'instructor' | 'admin';
  emailVerified: boolean;
  isActive: boolean;
  enrolledCourseIds?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface Course {
  $id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  categoryId?: string;
  instructorId?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language: 'bangla' | 'english' | 'hindi';
  duration: number;
  totalVideos: number;
  rating: number;
  totalReviews: number;
  totalStudents: number;
  isFeatured: boolean;
  isPublished: boolean;
  tags?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface Video {
  $id: string;
  title: string;
  slug: string;
  description?: string;
  courseId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  isPublished: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface Instructor {
  $id: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  specialization?: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface Institute {
  $id: string;
  name: string;
  code?: string;
  address?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface Enrollment {
  $id: string;
  userId: string;
  courseId: string;
  progress: number;
  completed: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface Notification {
  $id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'course-update';
  isRead: boolean;
  actionUrl?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface Category {
  $id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  parentId?: string;
  order?: number;
  courseCount?: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalVideos: number;
  totalEnrollments: number;
  activeSessions: number;
  newSignupsToday: number;
}

export interface ServiceStatus {
  status: 'connected' | 'error' | 'limited';
  message?: string;
}

// Appwrite Collection IDs
export const APPWRITE_COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses',
  VIDEOS: 'videos',
  INSTRUCTORS: 'instructors',
  INSTITUTES: 'institutes',
  ENROLLMENTS: 'enrollments',
  NOTIFICATIONS: 'notifications',
  DISCUSSIONS: 'discussions',
  USER_SETTINGS: 'user_settings',
  BOOKMARKS: 'bookmarks',
  WATCH_PROGRESS: 'watch_progress',
  CATEGORIES: 'categories',
} as const;
