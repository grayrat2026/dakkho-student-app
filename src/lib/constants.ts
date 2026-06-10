// ============================================================
// DAKKHO Admin — Constants (D1-Native, No Appwrite)
// ============================================================

export const R2_BUCKETS = {
  VIDEOS: 'dakkho-videos',
  THUMBNAILS: 'dakkho-thumbnails',
  AVATARS: 'dakkho-avatars',
  RESOURCES: 'dakkho-resources',
} as const;

export const TECHNOLOGIES = [
  'Computer Science & Technology',
  'Electrical Technology',
  'Electronics Technology',
  'Mechanical Technology',
  'Civil Technology',
  'Power Technology',
  'Electro Medical Technology',
] as const;

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export const LANGUAGES = ['bangla', 'english', 'hindi'] as const;
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error', 'announcement', 'course-update'] as const;
export const PACKAGE_TYPES = ['basic', 'standard', 'premium'] as const;
export const PAYMENT_STATUSES = ['pending', 'verified', 'rejected', 'refunded'] as const;
export const LIVE_CLASS_PLATFORMS = ['jitsi', 'zoom', 'meet', 'other'] as const;
export const LIVE_CLASS_STATUSES = ['scheduled', 'live', 'completed', 'cancelled'] as const;
export const EVENT_TYPES = ['event', 'special_day', 'holiday', 'exam', 'workshop'] as const;
export const ACHIEVEMENT_CATEGORIES = ['learning', 'streaks', 'social', 'special'] as const;

export const ACTIVITY_XP_MAP: Record<string, number> = {
  video_watch: 10,
  quiz_complete: 15,
  assignment_submit: 20,
  streak_bonus: 5,
  enrollment: 25,
  certificate: 50,
};

export const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const;

// Legacy Appwrite collection IDs (kept for backward compatibility with old route files)
export const APPWRITE_COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses',
  VIDEOS: 'videos',
  INSTRUCTORS: 'instructors',
  CATEGORIES: 'categories',
  NOTIFICATIONS: 'notifications',
};
