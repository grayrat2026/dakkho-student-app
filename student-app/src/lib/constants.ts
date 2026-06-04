export const APP_NAME = 'DAKKHO';
export const APP_DESCRIPTION = "Bangladesh's Premier Polytechnic Student Streaming Platform";

export const COLORS = {
  primary: '#0ea5e9',
  primaryDeep: '#2563eb',
  background: '#f0f9ff',
  cardBg: 'rgba(255,255,255,0.7)',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  accent: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
} as const;

// Technologies are now fetched from Worker API: GET /api/technologies
// This constant is removed — use technologyApi.list() from api-client.ts

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN = 60;

export const SIDEBAR_WIDTH = 260;
export const TOPBAR_HEIGHT = 64;
export const BOTTOM_NAV_HEIGHT = 64;

// Map old department page IDs to D1 technology short_codes
export const DEPT_TO_TECHNOLOGY: Record<string, string> = {
  'dept-cse': 'CST',
  'dept-eee': 'ET',
  'dept-me': 'MT',
  'dept-ce': 'CT',
  'dept-ete': 'EnT',
  'dept-power': 'PT',
  'dept-architecture': 'CT',
  'dept-textile': 'CT',
  'dept-chemical': 'CT',
  'dept-automobile': 'MT',
  'dept-rac': 'MT',
  'dept-glass-ceramic': 'CT',
  'dept-printing': 'CST',
  'dept-surveying': 'CT',
  'dept-mechatronics': 'EnT',
  'dept-mining': 'CT',
  'dept-metallurgical': 'MT',
  'dept-instrumentation': 'EnT',
  'dept-food': 'CT',
  'dept-leather': 'CT',
};

// Technology short_code to display name mapping (D1 data)
export const TECHNOLOGY_SHORT_NAMES: Record<string, string> = {
  CT: 'Civil Technology',
  CST: 'Computer Science & Technology',
  ET: 'Electrical Technology',
  EMT: 'Electro Medical Technology',
  EnT: 'Electronics Technology',
  MT: 'Mechanical Technology',
  PT: 'Power Technology',
};
