import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============ FORMATTING HELPERS (moved from mock-data.ts) ============

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function getLevelColor(level: string): string {
  switch (level) {
    case 'beginner': return '#10b981';
    case 'intermediate': return '#0ea5e9';
    case 'advanced': return '#f59e0b';
    case 'expert': return '#ef4444';
    default: return '#64748b';
  }
}

export const TRENDING_SEARCHES = [
  'Web Development', 'Python', 'Arduino', 'AutoCAD', 'React', 'Circuit Analysis', 'Machine Learning', 'Flutter',
];
