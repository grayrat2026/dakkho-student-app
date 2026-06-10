/**
 * Type definitions for DAKKHO Admin API on Cloudflare Workers
 * All Appwrite references removed — D1 only
 */

// ─── Server Config Types ───

export interface FeatureToggles {
  downloads: boolean;
  bookmarks: boolean;
  certificates: boolean;
  liveSessions: boolean;
  achievements: boolean;
  assignments: boolean;
  discussions: boolean;
  community: boolean;
  leaderboard: boolean;
  studyGroups: boolean;
  peerConnections: boolean;
  feedback: boolean;
  pricing: boolean;
  referral: boolean;
}

export interface HomePageSections {
  sections: string[];
}

export interface SidebarVisibility {
  menu: boolean;
  departments: boolean;
  semesters: boolean;
  exams: boolean;
  community: boolean;
  general: boolean;
}

export interface BottomNavTabs {
  tabs: { id: string; label: string; enabled: boolean; order: number }[];
}

export interface TopBarElements {
  search: boolean;
  notifications: boolean;
  avatar: boolean;
  hamburger: boolean;
}

export interface ContentProtection {
  enabled: boolean;
  noCopy: boolean;
  noRightClick: boolean;
  noScreenshot: boolean;
  noPrint: boolean;
  customContextMenu: boolean;
  watermark: boolean;
  dragProtection: boolean;
}

export interface ServerConfig {
  featureToggles: FeatureToggles;
  homePageSections: HomePageSections;
  sidebarVisibility: SidebarVisibility;
  bottomNavTabs: BottomNavTabs;
  topBarElements: TopBarElements;
  cardStyle: 'glass' | 'flat' | 'rounded';
  contentProtection: ContentProtection;
}

export const DEFAULT_CONFIG: ServerConfig = {
  featureToggles: {
    downloads: true,
    bookmarks: true,
    certificates: true,
    liveSessions: true,
    achievements: true,
    assignments: true,
    discussions: true,
    community: true,
    leaderboard: true,
    studyGroups: true,
    peerConnections: true,
    feedback: true,
    pricing: true,
    referral: true,
  },
  homePageSections: {
    sections: ['hero', 'continue-watching', 'categories', 'new-releases', 'live', 'trending', 'instructors', 'leaderboard', 'recommended'],
  },
  sidebarVisibility: {
    menu: true,
    departments: true,
    semesters: true,
    exams: true,
    community: true,
    general: true,
  },
  bottomNavTabs: {
    tabs: [
      { id: 'home', label: 'Home', enabled: true, order: 0 },
      { id: 'explore', label: 'Explore', enabled: true, order: 1 },
      { id: 'my-courses', label: 'My Courses', enabled: true, order: 2 },
      { id: 'watch-history', label: 'Watch History', enabled: true, order: 3 },
      { id: 'profile', label: 'Profile', enabled: true, order: 4 },
    ],
  },
  topBarElements: {
    search: true,
    notifications: true,
    avatar: true,
    hamburger: true,
  },
  cardStyle: 'glass',
  contentProtection: {
    enabled: true,
    noCopy: true,
    noRightClick: true,
    noScreenshot: true,
    noPrint: true,
    customContextMenu: true,
    watermark: false,
    dragProtection: true,
  },
};

// ─── Admin User Type ───

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// ─── D1 Row Types ───

export interface AdminSessionRow {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  is_active: number;
}

export interface AppConfigRow {
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  user_email: string | null;
  details: string;
  ip_address: string | null;
  created_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  bio: string | null;
  institute_id: number | null;
  technology: string | null;
  semester: number;
  avatar_url: string | null;
  role: string;
  email_verified: number;
  is_active: number;
  enrolled_course_ids: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CourseRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  category_id: string | null;
  instructor_id: string | null;
  technology_id: number | null;
  level: string;
  language: string;
  duration: number;
  total_videos: number;
  rating: number;
  total_reviews: number;
  total_students: number;
  price: number;
  is_featured: number;
  is_published: number;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  course_id: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number;
  sort_order: number;
  is_preview: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface InstructorRow {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  specialization: string | null;
  rating: number;
  total_students: number;
  total_courses: number;
  social_links: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  course_count: number;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  read: number;
  action_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstituteRow {
  id: number;
  name: string;
  name_bn: string | null;
  division: string | null;
  district: string | null;
  eiin_number: string | null;
  type: string;
  is_requested: number;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface TechnologyRow {
  id: number;
  name: string;
  name_bn: string | null;
  short_code: string | null;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface InstituteRequestRow {
  id: number;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  institute_name: string;
  institute_name_bn: string | null;
  division: string | null;
  district: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoursePackageRow {
  id: number;
  course_id: string;
  package_type: string;
  price: number;
  duration_months: number;
  max_users: number;
  is_auto_assign: number;
  is_active: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPackageRow {
  id: number;
  user_id: string;
  package_id: number;
  course_id: string;
  package_type: string;
  activated_at: string;
  expires_at: string;
  shared_with: string | null;
  status: string;
  created_at: string;
}

export interface CouponRow {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount: number | null;
  min_purchase: number;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string;
  applicable_courses: string | null;
  applicable_technologies: string | null;
  is_active: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscountRow {
  id: number;
  name: string;
  name_bn: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  applicable_type: string;
  applicable_ids: string | null;
  valid_from: string;
  valid_until: string;
  is_auto_apply: number;
  is_active: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: number;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  event_type: string;
  banner_url: string | null;
  start_date: string;
  end_date: string | null;
  is_featured: number;
  metadata: string;
  is_active: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveClassRow {
  id: number;
  course_id: string | null;
  title: string;
  title_bn: string | null;
  description: string | null;
  instructor_id: string | null;
  technology_id: number | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  platform: string;
  status: string;
  recording_url: string | null;
  is_active: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: number;
  user_id: string;
  package_id: number | null;
  course_id: string | null;
  amount: number;
  currency: string;
  gateway: string;
  gateway_trx_id: string | null;
  gateway_payment_id: string | null;
  status: string;
  proof_url: string | null;
  trx_id_submitted: string | null;
  phone_submitted: string | null;
  verified_by: string | null;
  verified_at: string | null;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationLogRow {
  id: number;
  type: string;
  category: string;
  title: string | null;
  message: string | null;
  target_type: string | null;
  target_id: string | null;
  sent_count: number;
  failed_count: number;
  metadata: string;
  created_by: string | null;
  created_at: string;
}

export interface UserPushTokenRow {
  id: number;
  user_id: string;
  push_token: string;
  device_type: string | null;
  device_info: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface StudentSessionRow {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
  is_active: number;
}

export interface User2FARow {
  id: number;
  user_id: string;
  method: string;
  totp_secret: string | null;
  totp_verified: number;
  backup_codes: string | null;
  is_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentConfigRow {
  id: number;
  gateway: string;
  is_active: number;
  config: string;
  sandbox_mode: number;
  instructions: string | null;
  instructions_bn: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceRow {
  id: number;
  user_id: string;
  push_enabled: number;
  email_enabled: number;
  sms_enabled: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  course_updates_push: number;
  course_updates_email: number;
  grades_push: number;
  grades_email: number;
  schedule_push: number;
  schedule_email: number;
  payment_push: number;
  payment_email: number;
  promotions_push: number;
  promotions_email: number;
  social_push: number;
  social_email: number;
  system_push: number;
  system_email: number;
  updated_at: string;
  created_at: string;
}

export interface StudentActivityRow {
  id: number;
  user_id: string;
  activity_type: string;
  resource_type: string;
  resource_id: string | null;
  title: string;
  description: string | null;
  metadata: string;
  created_at: string;
}

export interface AchievementDefinitionRow {
  id: number;
  slug: string;
  name: string;
  name_bn: string | null;
  description: string;
  description_bn: string | null;
  category: string;
  icon: string;
  xp: number;
  condition_type: string;
  condition_value: string;
  is_active: number;
  created_at: string;
}

export interface StudentAchievementRow {
  id: number;
  user_id: string;
  achievement_id: number;
  unlocked_at: string;
}

export interface NotificationSoundRow {
  id: number;
  name: string;
  file_url: string;
  is_default: number;
  is_active: number;
  created_at: string;
}

export interface SupportTicketRow {
  id: number;
  ticket_id: string;
  user_id: string | null;
  name: string | null;
  email: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string | null;
  resolved_content: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessageRow {
  id: number;
  ticket_id: string;
  sender_type: string;
  sender_name: string | null;
  message: string;
  attachments: string;
  source: string;
  created_at: string;
}

// ─── Service Status Types ───

export interface ServiceStatus {
  status: 'connected' | 'error' | 'limited';
  message?: string;
}
