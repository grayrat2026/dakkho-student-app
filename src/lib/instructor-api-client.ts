/**
 * DAKKHO Instructor API Client
 *
 * All instructor-facing API calls go through the Worker API.
 * Uses `dakkho_instructor_token` from localStorage for auth.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://dakkho-admin-api.dakkho-admin.workers.dev';

const AUTH_TOKEN_KEY = 'dakkho_instructor_token';

export function getInstructorToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/instructor${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getInstructorToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, message: (data as Record<string, unknown>).error || (data as Record<string, unknown>).message || 'Request failed', ...(data as Record<string, unknown>) };
  }

  return res.json() as Promise<T>;
}

// ============ TYPE-SAFE API FUNCTIONS ============

export const instructorApi = {
  // Dashboard
  getDashboard: () =>
    request<{ success: boolean; dashboard: InstructorDashboard }>('/dashboard'),

  // Profile
  getProfile: () =>
    request<{ success: boolean; profile: InstructorProfile }>('/profile'),
  updateProfile: (data: Partial<InstructorProfile>) =>
    request<{ success: boolean; profile: InstructorProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return request<{ success: boolean; avatar_url: string }>('/profile/avatar', {
      method: 'POST',
      body: fd,
      headers: {} as Record<string, string>, // Let browser set content-type
    });
  },

  // Courses
  getCourses: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    return request<{ courses: InstructorCourse[]; total: number }>(`/courses?${qs.toString()}`);
  },
  getCourse: (id: string) =>
    request<{ success: boolean; course: InstructorCourse; studentCount: number }>(`/courses/${id}`),
  getCourseStudents: (id: string) =>
    request<{ students: InstructorEnrollment[]; total: number }>(`/courses/${id}/students`),
  getCourseVideos: (id: string) =>
    request<{ videos: InstructorVideo[]; total: number }>(`/courses/${id}/videos`),
  getCourseProgress: (id: string) =>
    request<{ success: boolean; courseId: string; totalStudents: number; totalVideos: number; averageProgress: number; progress: StudentProgressEntry[] }>(`/courses/${id}/progress`),
  getCourseAnalytics: (id: string) =>
    request<{ success: boolean; analytics: CourseAnalytics }>(`/courses/${id}/analytics`),

  // Schedule
  getSchedule: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : '';
    return request<{ success: boolean; schedule: ScheduleEntry[] }>(`/schedule${qs}`);
  },

  // Reviews
  getReviews: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<{ success: boolean; reviews: ReviewEntry[]; stats: ReviewStats; page: number; limit: number }>(`/reviews?${qs.toString()}`);
  },

  // Notifications
  getNotifications: (params?: { limit?: number; offset?: number; unread?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    if (params?.unread) qs.set('unread', 'true');
    return request<{ success: boolean; notifications: NotificationEntry[]; total: number }>(`/notifications?${qs.toString()}`);
  },
  markNotificationRead: (id: string) =>
    request<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),

  // Change Password
  changePassword: (data: { current_password: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Support
  createTicket: (data: { category: string; subject: string; description: string; priority?: string }) =>
    request<{ success: boolean; ticket: { ticketId: string; status: string; createdAt: string } }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTickets: () =>
    request<{ success: boolean; tickets: SupportTicket[] }>('/support/tickets'),
};

// ============ TYPES ============

export interface InstructorDashboard {
  courseCount: number;
  totalStudents: number;
  upcomingClasses: number;
  avgRating: number;
  totalReviews: number;
  totalRevenue: number;
}

export interface InstructorProfile {
  $id?: string;
  name?: string;
  email?: string;
  bio?: string;
  specialization?: string;
  phone?: string;
  department?: string;
  title?: string;
  avatarUrl?: string;
  avatar?: string;
}

export interface InstructorCourse {
  $id: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  price?: number;
  level?: string;
  instructorId?: string;
  isPublished?: boolean;
  status?: string;
  rating?: number;
  studentCount?: number;
  $createdAt?: string;
  $updatedAt?: string;
  [key: string]: unknown;
}

export interface InstructorEnrollment {
  $id?: string;
  courseId?: string;
  userId?: string;
  progress?: number;
  completed?: boolean;
  student?: {
    id?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  $createdAt?: string;
}

export interface InstructorVideo {
  $id: string;
  title?: string;
  courseId?: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
  isFree?: boolean;
  isPublished?: boolean;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

export interface StudentProgressEntry {
  userId?: string;
  enrollmentId?: string;
  completedVideos: number;
  totalVideos: number;
  progressPercent: number;
  totalWatchTime: number;
}

export interface CourseAnalytics {
  courseId: string;
  enrollmentCount: number;
  videoCount: number;
  revenue: number;
  paymentCount: number;
  avgRating: number;
  reviewCount: number;
}

export interface ScheduleEntry {
  id: number;
  course_id: string;
  title: string;
  description?: string;
  instructor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
  platform?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ReviewEntry {
  id: number;
  instructor_id: string;
  course_id?: string;
  student_name?: string;
  student_email?: string;
  rating: number;
  comment?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

export interface NotificationEntry {
  $id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  $createdAt?: string;
  [key: string]: unknown;
}

export interface SupportTicket {
  ticket_id: string;
  user_id: string;
  name?: string;
  email?: string;
  category: string;
  subject: string;
  description?: string;
  priority?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}
