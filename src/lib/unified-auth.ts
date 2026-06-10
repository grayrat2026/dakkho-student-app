'use client';

import { create } from 'zustand';

// ============ TYPES ============
export type UserRole = 'student' | 'instructor' | 'admin';

export interface UnifiedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  instituteId?: number;
  technology?: string;
  emailVerified?: boolean;
}

interface UnifiedAuthState {
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UnifiedUser>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// ============ CONSTANTS ============
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dakkho-admin-api.dakkho-admin.workers.dev';

const TOKEN_KEYS: Record<UserRole, string> = {
  student: 'dakkho_student_token',
  instructor: 'dakkho_instructor_token',
  admin: 'dakkho_admin_token',
};

const AUTH_SESSION_KEY = 'dakkho-unified-auth-session';
const LAST_LOGIN_KEY = 'dakkho_last_login_timestamp';

// ============ HELPERS ============
function getTokenForRole(role: UserRole): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS[role]);
}

function setTokenForRole(role: UserRole, token: string): void {
  if (typeof window === 'undefined') return;
  // Clear other role tokens — single session at a time
  Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(TOKEN_KEYS[role], token);
  localStorage.setItem(LAST_LOGIN_KEY, String(Date.now()));
}

function clearAllTokens(): void {
  if (typeof window === 'undefined') return;
  Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(LAST_LOGIN_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function getActiveToken(): { token: string; role: UserRole } | null {
  if (typeof window === 'undefined') return null;

  // Check each role token, keep the one with the most recent login
  let bestToken: string | null = null;
  let bestRole: UserRole | null = null;
  let bestTimestamp = 0;

  for (const [role, key] of Object.entries(TOKEN_KEYS) as [UserRole, string][]) {
    const token = localStorage.getItem(key);
    if (token) {
      // Use the last login timestamp to determine which session to keep
      const timestamp = parseInt(localStorage.getItem(LAST_LOGIN_KEY) || '0', 10);
      if (timestamp >= bestTimestamp) {
        bestToken = token;
        bestRole = role;
        bestTimestamp = timestamp;
      }
    }
  }

  if (bestToken && bestRole) {
    return { token: bestToken, role: bestRole };
  }
  return null;
}

function saveSession(user: UnifiedUser): void {
  if (typeof window === 'undefined') return;
  try {
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ user, expiresAt }));
  } catch {}
}

function loadSession(): UnifiedUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
        return parsed.user;
      }
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {}
  return null;
}

// ============ STORE ============
export const useUnifiedAuth = create<UnifiedAuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start true so we check auth on load

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Use the unified login endpoint from Phase 1
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      const role: UserRole = data.role || 'student';
      const token = data.token;

      if (!token) {
        throw new Error('No token received');
      }

      // Store token in role-specific localStorage key
      setTokenForRole(role, token);

      const user: UnifiedUser = {
        id: data.userId || data.user?.id || '',
        email: data.user?.email || email,
        name: data.user?.name || '',
        role,
        avatarUrl: data.user?.avatarUrl || '',
        instituteId: data.user?.instituteId || undefined,
        technology: data.user?.technology || undefined,
        emailVerified: data.user?.emailVerified || false,
      };

      saveSession(user);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.message || 'Invalid email or password');
    }
  },

  logout: async () => {
    const { user } = get();
    try {
      const active = getActiveToken();
      if (active) {
        // Call the appropriate logout endpoint
        if (user?.role === 'admin') {
          await fetch(`${API_BASE}/admin/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${active.token}` },
          }).catch(() => {});
        } else if (user?.role === 'instructor') {
          await fetch(`${API_BASE}/instructor/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${active.token}` },
          }).catch(() => {});
        } else {
          await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${active.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).catch(() => {});
        }
      }
    } catch {}
    clearAllTokens();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    // Try to load from session cache first
    const cachedUser = loadSession();
    const active = getActiveToken();

    if (!active && !cachedUser) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    if (active) {
      try {
        // Validate token with the appropriate endpoint
        let checkUrl: string;
        if (active.role === 'admin') {
          checkUrl = `${API_BASE}/admin/auth/check`;
        } else if (active.role === 'instructor') {
          checkUrl = `${API_BASE}/instructor/auth/check`;
        } else {
          checkUrl = `${API_BASE}/api/auth/me`;
        }

        const res = await fetch(checkUrl, {
          headers: { Authorization: `Bearer ${active.token}` },
        });

        if (res.ok) {
          const data = await res.json();

          if (active.role === 'admin' && data.authenticated) {
            const user: UnifiedUser = {
              id: data.user?.id || cachedUser?.id || '',
              email: data.user?.email || cachedUser?.email || '',
              name: data.user?.name || cachedUser?.name || '',
              role: 'admin',
              avatarUrl: data.user?.avatar_url || cachedUser?.avatarUrl || '',
            };
            saveSession(user);
            set({ user, isAuthenticated: true, isLoading: false });
            return;
          } else if (active.role === 'instructor' && data.authenticated) {
            const user: UnifiedUser = {
              id: data.instructor?.id || cachedUser?.id || '',
              email: data.instructor?.email || cachedUser?.email || '',
              name: data.instructor?.name || cachedUser?.name || '',
              role: 'instructor',
              avatarUrl: data.instructor?.avatar_url || cachedUser?.avatarUrl || '',
            };
            saveSession(user);
            set({ user, isAuthenticated: true, isLoading: false });
            return;
          } else if (active.role === 'student' && data.user) {
            const user: UnifiedUser = {
              id: data.user.id || cachedUser?.id || '',
              email: data.user.email || cachedUser?.email || '',
              name: data.user.name || cachedUser?.name || '',
              role: 'student',
              instituteId: data.user.instituteId || cachedUser?.instituteId,
              technology: data.user.technology || cachedUser?.technology,
              emailVerified: data.user.emailVerified || cachedUser?.emailVerified,
            };
            saveSession(user);
            set({ user, isAuthenticated: true, isLoading: false });
            return;
          }
        }

        // Token invalid — clear everything
        clearAllTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      } catch {
        // Network error — use cached session if available
        if (cachedUser) {
          set({ user: cachedUser, isAuthenticated: true, isLoading: false });
        } else {
          clearAllTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } else if (cachedUser) {
      // No token but cached session — might be expired
      set({ user: cachedUser, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },
}));
