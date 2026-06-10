/**
 * DAKKHO Student Routes — Cloudflare Workers + Hono
 *
 * Mounted at /student — separate from /api for cleaner separation.
 * Uses Appwrite for data storage, D1 for sessions, R2 for avatars.
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import {
  validateStudentSession,
  createStudentSession,
  deleteStudentSession,
  updateEmailVerifiedForUser,
} from '../lib/student-auth';
import {
  createSession,
  getAccount,
  deleteSession,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  Query,
} from '../lib/appwrite';
import { APPWRITE_COLLECTIONS, DEFAULT_CONFIG, type ServerConfig } from '../lib/types';
import { getErrorMessage } from '../lib/utils';
import { uploadFile, getBucketForType, getPublicUrl, getFile } from '../lib/r2';
import { createAndSendOTP, verifyOTP } from '../lib/otp';
import { getStreakInfo, recordActivity, getStreakCalendar } from '../lib/streak';
import { checkAndUnlockAchievements, getUserAchievements } from '../lib/achievements';
import { RATE_LIMITS, rateLimitMiddleware } from '../lib/rate-limit';
import {
  notifyAchievementUnlocked,
  notifyStreakMilestone,
  notifyPaymentStatus,
} from '../lib/auto-notifications';

const studentRoutes = new Hono<{ Bindings: Env }>();

// ─── Helper: Get student auth from header ───

async function getStudentAuth(
  c: any
): Promise<{ authorized: boolean; userId?: string; email?: string; emailVerified?: boolean }> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false };
  }
  const token = authHeader.substring(7);
  const result = await validateStudentSession(c.env, token);
  return result;
}

// ─── Helper: Require email verification ───
// Returns auth if verified, or responds with 403 if not.
// Use this as a gate for write-sensitive endpoints.

async function requireEmailVerified(
  c: any
): Promise<{ authorized: boolean; userId?: string; email?: string; emailVerified?: boolean } | Response> {
  const auth = await getStudentAuth(c);
  if (!auth.authorized) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (!auth.emailVerified) {
    return c.json({ error: 'Email verification required', code: 'EMAIL_NOT_VERIFIED' }, 403);
  }
  return auth;
}

// ─── Helper: Create Appwrite user via REST API ───

async function createAppwriteUser(
  env: Env,
  email: string,
  password: string,
  name: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${env.APPWRITE_ENDPOINT}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': env.APPWRITE_PROJECT_ID,
      'X-Appwrite-Key': env.APPWRITE_API_KEY,
    },
    body: JSON.stringify({
      userId: 'unique()',
      email,
      password,
      name,
      prefs: {
        role: 'student',
        emailVerified: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to create user' }));
    throw new Error((err as { message?: string }).message || 'Failed to create user');
  }

  return res.json() as Promise<Record<string, unknown>>;
}

// ─── Helper: Update Appwrite user prefs ───

async function updateAppwriteUserPrefs(
  env: Env,
  userId: string,
  prefs: Record<string, unknown>
): Promise<void> {
  // First get existing prefs
  const res = await fetch(`${env.APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': env.APPWRITE_PROJECT_ID,
      'X-Appwrite-Key': env.APPWRITE_API_KEY,
    },
    body: JSON.stringify({ prefs }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update user prefs' }));
    throw new Error((err as { message?: string }).message || 'Failed to update user prefs');
  }
}

// ─── Helper: Find user profile document ───
// The users collection document ID may or may not match the auth user ID.
// Try by document ID first, then by userId field.

async function findUserProfile(
  env: Env,
  authUserId: string
): Promise<(Record<string, unknown> & { $id: string }) | null> {
  // Try 1: Get by document ID (if doc ID == auth user ID)
  try {
    const doc = await getDocument(env, APPWRITE_COLLECTIONS.USERS, authUserId);
    return doc as Record<string, unknown> & { $id: string };
  } catch {
    // Not found by ID, try search
  }

  // Try 2: Search by userId field
  try {
    const result = await listDocuments(env, APPWRITE_COLLECTIONS.USERS, [
      Query.equal('userId', authUserId),
      Query.limit(1),
    ]);
    if (result.documents.length > 0) {
      return result.documents[0] as Record<string, unknown> & { $id: string };
    }
  } catch {
    // Search failed
  }

  return null;
}

// ─── Helper: Map raw Appwrite course document to frontend CourseListItem format ───

function mapCourseDoc(doc: any) {
  return {
    id: doc.$id,
    title: doc.title || '',
    slug: doc.slug || '',
    description: doc.description || '',
    thumbnailUrl: doc.thumbnailUrl || doc.thumbnail_url || null,
    bannerUrl: doc.bannerUrl || doc.banner_url || null,
    categoryId: doc.categoryId || doc.category_id || null,
    instructorId: doc.instructorId || doc.instructor_id || '',
    instructorName: doc.instructorName || doc.instructor_name || '',
    level: doc.level || 'beginner',
    language: doc.language || 'Bangla',
    duration: Number(doc.duration || doc.total_duration_minutes || 0),
    totalVideos: Number(doc.totalVideos || doc.total_videos || 0),
    rating: Number(doc.rating || 0),
    totalReviews: Number(doc.totalReviews || doc.total_reviews || 0),
    totalStudents: Number(doc.totalStudents || doc.total_students || doc.enrollment_count || 0),
    isFeatured: Boolean(doc.isFeatured ?? doc.is_featured ?? false),
    isPublished: Boolean(doc.isPublished ?? doc.is_published ?? false),
    status: doc.status || 'draft',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    price: Number(doc.price || 0),
    department: doc.department || null,
    semester: doc.semester ?? null,
    previewVideoUrl: doc.previewVideoUrl || doc.preview_video_url || null,
    createdAt: doc.$createdAt || null,
    updatedAt: doc.$updatedAt || null,
  };
}

// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES (no auth required)
// ═══════════════════════════════════════════════════════════════

// POST /auth/login — Login student
studentRoutes.post('/auth/login', rateLimitMiddleware('auth', RATE_LIMITS.auth), async (c) => {
  try {
    const { email, password, deviceId, deviceInfo } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Create Appwrite session
    const { sessionCookie } = await createSession(c.env, email, password);

    // Get account info
    const account = await getAccount(c.env, sessionCookie);

    // Check that user is NOT admin
    const prefs = (account as any).prefs || {};
    if (prefs.role === 'admin') {
      // Delete the Appwrite session — admins shouldn't use student login
      await deleteSession(c.env, sessionCookie);
      return c.json({ error: 'Admin accounts cannot login here' }, 403);
    }

    const userId = (account as any).$id as string;
    const userName = (account as any).name as string;
    const userEmail = (account as any).email as string;
    const userRole = prefs.role || 'student';
    const emailVerified = prefs.emailVerified === true || prefs.emailVerified === 'true';

    // Create D1 student session (multi-device: does NOT kill other sessions)
    const token = await createStudentSession(c.env, userId, userEmail, deviceId, deviceInfo, emailVerified);

    // Fetch user profile from Appwrite users collection
    const profile = await findUserProfile(c.env, userId);

    const user = {
      id: userId,
      email: userEmail,
      name: userName,
      role: userRole,
      emailVerified,
      phone: (profile?.phone as string) || null,
      institute: (profile?.institute as string) || null,
      technology: (profile?.technology as string) || null,
      semester: (profile?.semester as string) || null,
      avatarUrl: (profile?.avatarUrl as string) || (profile?.avatar_url as string) || null,
      fullName: (profile?.fullName as string) || (profile?.full_name as string) || userName,
    };

    // Clean up the Appwrite session — we use our own D1 session
    await deleteSession(c.env, sessionCookie);

    return c.json({ token, user, emailVerified });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 401);
  }
});

// POST /auth/check — Verify session
studentRoutes.post('/auth/check', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ authenticated: false, user: null });
    }

    // Fetch fresh user data from Appwrite
    const profile = await findUserProfile(c.env, auth.userId!);

    const user = {
      id: auth.userId,
      email: auth.email,
      emailVerified: auth.emailVerified || false,
      name: (profile?.fullName as string) || (profile?.full_name as string) || (profile?.name as string) || null,
      role: (profile?.role as string) || 'student',
      phone: (profile?.phone as string) || null,
      institute: (profile?.institute as string) || null,
      technology: (profile?.technology as string) || null,
      semester: (profile?.semester as string) || null,
      avatarUrl: (profile?.avatarUrl as string) || (profile?.avatar_url as string) || null,
      fullName: (profile?.fullName as string) || (profile?.full_name as string) || null,
    };

    return c.json({ authenticated: true, user, emailVerified: auth.emailVerified || false });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// DELETE /auth/logout — Logout
studentRoutes.delete('/auth/logout', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const authHeader = c.req.header('Authorization');
    const token = authHeader!.substring(7);

    await deleteStudentSession(c.env, token);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// REGISTRATION ROUTE (no auth required)
// ═══════════════════════════════════════════════════════════════

// POST /auth/register — Register a new student
studentRoutes.post('/auth/register', rateLimitMiddleware('auth', RATE_LIMITS.auth), async (c) => {
  try {
    const { name, email, password, phone, institute, technology, semester } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ error: 'Name, email, and password are required' }, 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Password strength check
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Create Appwrite user via REST API
    const appwriteUser = await createAppwriteUser(c.env, email, password, name);
    const userId = (appwriteUser as any).$id as string;

    // Create user profile document in Appwrite users collection
    // Note: The document ID is set to the auth user ID for easy lookup.
    // Only include attributes that exist in the users collection schema:
    // email, fullName, institute, instituteName, technology, role, phone, semester
    const profileData: Record<string, unknown> = {
      email,
      fullName: name,
      role: 'student',
    };
    if (phone) profileData.phone = phone;
    if (institute) {
      profileData.institute = institute;
      profileData.instituteName = institute;
    }
    if (technology) profileData.technology = technology;
    if (semester) profileData.semester = semester;

    try {
      await createDocument(c.env, APPWRITE_COLLECTIONS.USERS, profileData, userId);
    } catch (profileErr) {
      console.error('Failed to create user profile document:', getErrorMessage(profileErr));
      // Non-fatal: user was created in Appwrite auth, profile can be updated later
    }

    // Auto-send OTP for email verification
    try {
      await createAndSendOTP(
        c.env.DB,
        email,
        'email',
        c.env.RESEND_API_KEY,
        c.env.RESEND_FROM_EMAIL
      );
    } catch (otpErr) {
      console.error('Failed to send verification OTP:', getErrorMessage(otpErr));
      // Non-fatal: user can request OTP later
    }

    // Create D1 student session with emailVerified=false
    const token = await createStudentSession(c.env, userId, email, undefined, undefined, false);

    const user = {
      id: userId,
      email,
      name,
      role: 'student',
      phone: phone || null,
      institute: institute || null,
      technology: technology || null,
      semester: semester || null,
      avatarUrl: null,
      fullName: name,
    };

    return c.json({ token, user, emailVerified: false }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
});

// ═══════════════════════════════════════════════════════════════
// EMAIL VERIFICATION ROUTES (auth required)
// ═══════════════════════════════════════════════════════════════

// POST /auth/email/verify/send — Send OTP to verify email
studentRoutes.post('/auth/email/verify/send', rateLimitMiddleware('otp', RATE_LIMITS.otp), async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (auth.emailVerified) {
      return c.json({ error: 'Email is already verified' }, 400);
    }

    const result = await createAndSendOTP(
      c.env.DB,
      auth.email!,
      'email',
      c.env.RESEND_API_KEY,
      c.env.RESEND_FROM_EMAIL
    );

    if (!result.success) {
      return c.json({ error: result.message }, 429);
    }

    return c.json({ success: true, message: result.message, expiresAt: result.expiresAt });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /auth/email/verify — Verify OTP, set emailVerified=true
studentRoutes.post('/auth/email/verify', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (auth.emailVerified) {
      return c.json({ error: 'Email is already verified' }, 400);
    }

    const { code } = await c.req.json();
    if (!code) {
      return c.json({ error: 'OTP code is required' }, 400);
    }

    // Verify the OTP
    const result = await verifyOTP(c.env.DB, auth.email!, code);

    if (!result.valid) {
      return c.json({ error: result.message }, 400);
    }

    // Update Appwrite user prefs: emailVerified=true
    try {
      await updateAppwriteUserPrefs(c.env, auth.userId!, {
        role: 'student',
        emailVerified: true,
      });
    } catch (prefsErr) {
      console.error('Failed to update Appwrite prefs:', getErrorMessage(prefsErr));
      // Continue: D1 session update is the primary source of truth
    }

    // Update D1 session email_verified flag for all active sessions
    await updateEmailVerifiedForUser(c.env, auth.userId!, true);

    // Store verification token in email_verification_tokens for audit
    const verificationId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO email_verification_tokens (id, user_id, token, expires_at, used, created_at)
       VALUES (?, ?, 'verified', datetime('now', '+1 year'), 1, datetime('now'))`
    ).bind(verificationId, auth.userId).run();

    return c.json({ success: true, message: 'Email verified successfully', emailVerified: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// PROFILE ROUTES (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /profile — Get own profile
studentRoutes.get('/profile', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await findUserProfile(c.env, auth.userId!);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /profile — Update profile (no email verification required)
studentRoutes.put('/profile', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const data = await c.req.json();
    const allowedFields = ['fullName', 'phone', 'institute', 'technology', 'semester', 'avatarUrl'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    const profile = await findUserProfile(c.env, auth.userId!);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Filter out fields that don't exist in the Appwrite collection to avoid
    // "Invalid document structure: Unknown attribute" errors.
    // Strategy: Get the existing document first, check which fields exist,
    // and only update those that are present in the current document.
    const existingDocKeys = Object.keys(profile).filter(k => !k.startsWith('$'));
    const safeUpdates: Record<string, unknown> = {};
    const skippedFields: string[] = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (existingDocKeys.includes(field)) {
          safeUpdates[field] = data[field];
        } else {
          skippedFields.push(field);
        }
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return c.json({ 
        error: 'No updatable fields found. Missing attributes in collection: ' + skippedFields.join(', '),
        skippedFields 
      }, 400);
    }

    const updated = await updateDocument(
      c.env,
      APPWRITE_COLLECTIONS.USERS,
      profile.$id,
      safeUpdates
    );

    return c.json({ profile: updated, skippedFields });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /profile/avatar — Upload avatar to R2 (no email verification required)
studentRoutes.post('/profile/avatar', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'File is required' }, 400);
    }

    // Upload to R2_AVATARS bucket
    const arrayBuffer = await file.arrayBuffer();
    const key = `avatars/${auth.userId}/${Date.now()}-${file.name}`;
    const r2Bucket = getBucketForType('avatars', c.env);

    await uploadFile(r2Bucket, key, arrayBuffer, file.type);

    // Generate public URL
    const avatarUrl = getPublicUrl(c.env, 'avatars', key);

    // Update user document with new avatarUrl
    const profile = await findUserProfile(c.env, auth.userId!);
    if (profile) {
      await updateDocument(c.env, APPWRITE_COLLECTIONS.USERS, profile.$id, {
        avatarUrl,
      });
    }

    return c.json({ avatarUrl });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION ROUTES (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /notifications — List user's notifications
studentRoutes.get('/notifications', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const queries = [
      Query.equal('userId', auth.userId!),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ];

    let result;
    try {
      result = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, queries);
    } catch (queryError) {
      // If attribute-based query fails, try simpler query
      const errMsg = getErrorMessage(queryError);
      if (errMsg.includes('Attribute not found')) {
        // Fall back to listing all and filtering manually
        result = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, [
          Query.limit(limit + 100),
          Query.orderDesc('$createdAt'),
        ]);
        // Filter manually
        result.documents = result.documents.filter((doc: any) => doc.userId === auth.userId);
        result.total = result.documents.length;
        // Re-apply pagination
        result.documents = result.documents.slice(offset, offset + limit);
      } else {
        throw queryError;
      }
    }

    // Get unread count - try with isRead, fall back if attribute doesn't exist
    let unreadCount = 0;
    try {
      const unreadResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, [
        Query.equal('userId', auth.userId!),
        Query.equal('isRead', false),
        Query.limit(0),
      ]);
      unreadCount = unreadResult.total;
    } catch {
      // If isRead attribute doesn't exist, count from the fetched results
      unreadCount = result.documents.filter((doc: any) => !doc.isRead && !doc.read).length;
    }

    // Filter out dismissed notifications (if the "dismissed" attribute exists)
    const filteredDocs = result.documents.filter((doc: any) => !doc.dismissed);

    return c.json({
      notifications: filteredDocs,
      total: filteredDocs.length,
      unreadCount,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /notifications/read — Mark notification(s) as read
studentRoutes.put('/notifications/read', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const data = await c.req.json();

    if (data.all === true) {
      // Mark all notifications as read for this user
      const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, [
        Query.equal('userId', auth.userId!),
        Query.equal('isRead', false),
        Query.limit(500),
      ]);

      for (const doc of result.documents) {
        const docAny = doc as Record<string, unknown> & { $id: string };
        await updateDocument(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, docAny.$id, {
          isRead: true,
        });
      }
    } else if (data.notificationId) {
      // Mark single notification as read
      await updateDocument(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, data.notificationId, {
        isRead: true,
      });
    } else {
      return c.json({ error: 'Provide notificationId or { all: true }' }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /notifications/dismiss — Dismiss a notification permanently
studentRoutes.put('/notifications/dismiss', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const data = await c.req.json();
    if (!data.notificationId) {
      return c.json({ error: 'notificationId is required' }, 400);
    }

    // Try to set `dismissed: true` on the document (if the attribute exists in Appwrite)
    // Also mark as read for good measure
    const updates: Record<string, unknown> = { isRead: true };

    try {
      await updateDocument(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, data.notificationId, {
        ...updates,
        dismissed: true,
      });
    } catch (updateErr) {
      // If "dismissed" attribute doesn't exist in Appwrite, fall back to just marking as read
      const errMsg = getErrorMessage(updateErr);
      if (errMsg.includes('Attribute not found') || errMsg.includes('Unknown attribute')) {
        try {
          await updateDocument(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, data.notificationId, updates);
        } catch (fallbackErr) {
          // Even marking as read may fail — the notification might not exist
          console.error('Failed to dismiss notification (fallback):', getErrorMessage(fallbackErr));
        }
      } else {
        throw updateErr;
      }
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /notifications/unread-count — Get unread count
studentRoutes.get('/notifications/unread-count', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Fetch all user notifications and count unread manually
    // (Appwrite boolean queries can be unreliable with the JSON query format)
    let count = 0;
    try {
      const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, [
        Query.equal('userId', auth.userId!),
        Query.limit(500),
      ]);
      count = result.documents.filter((doc: any) => !doc.isRead && !doc.read).length;
    } catch {
      // If userId query fails, try listing all and filtering
      try {
        const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, [
          Query.limit(500),
          Query.orderDesc('$createdAt'),
        ]);
        count = result.documents
          .filter((doc: any) => doc.userId === auth.userId)
          .filter((doc: any) => !doc.isRead && !doc.read)
          .length;
      } catch {
        count = 0;
      }
    }

    return c.json({ count });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// COURSE ROUTES (Bearer token required unless noted)
// ═══════════════════════════════════════════════════════════════

// GET /courses — List enrolled courses with progress
studentRoutes.get('/courses', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Fetch enrollments for the current user
    const enrollmentsResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
      Query.equal('userId', auth.userId!),
      Query.limit(100),
    ]);

    const courses = [];

    for (const enrollment of enrollmentsResult.documents) {
      const enr = enrollment as Record<string, unknown> & { $id: string };
      const courseId = enr.courseId as string;

      try {
        // Fetch course details
        const course = await getDocument(c.env, APPWRITE_COLLECTIONS.COURSES, courseId);

        // Fetch watch progress for this course
        const progressResult = await listDocuments(
          c.env,
          APPWRITE_COLLECTIONS.WATCH_PROGRESS,
          [
            Query.equal('userId', auth.userId!),
            Query.equal('courseId', courseId),
            Query.limit(100),
          ]
        );

        courses.push({
          ...mapCourseDoc(course),
          enrollment: enr,
          progress: progressResult.documents,
        });
      } catch {
        // Course may have been deleted; skip
        courses.push({
          courseId,
          enrollment: enr,
          progress: [],
          error: 'Course not found',
        });
      }
    }

    return c.json({ courses });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /courses/all — Course catalog (published only)
studentRoutes.get('/courses/all', rateLimitMiddleware('api', RATE_LIMITS.api), async (c) => {
  try {
    const search = c.req.query('search');
    const category = c.req.query('category');
    const department = c.req.query('department');
    const semesterStr = c.req.query('semester');
    const level = c.req.query('level');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const semester = semesterStr ? parseInt(semesterStr) : undefined;

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    // Only filter by isPublished if the attribute exists (skip if no courses yet)
    try {
      queries.unshift(Query.equal('isPublished', true));
    } catch (_) {}

    if (search) {
      queries.unshift(Query.search('title', search));
    }

    if (category) {
      queries.unshift(Query.equal('categoryId', category));
    }

    if (level) {
      queries.unshift(Query.equal('level', level));
    }

    // Department filtering: "all" means visible to everyone
    // Specific department: show courses where department = "all" OR department = specific dept
    if (department && department !== 'all') {
      try {
        // Appwrite doesn't support OR queries natively, so we query with equal
        // and then also include "all" courses in post-processing
        queries.unshift(Query.equal('department', department));
      } catch (_) {}
    }

    // Semester filtering: 0 or undefined = all semesters
    if (semester && semester > 0) {
      try {
        queries.unshift(Query.equal('semester', semester));
      } catch (_) {}
    }

    let result;
    try {
      result = await listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, queries);
    } catch (queryError: any) {
      // If isPublished attribute doesn't exist, retry without it
      if (String(queryError).includes('Attribute not found')) {
        const fallbackQueries = queries.filter(q => !q.includes('isPublished'));
        result = await listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, fallbackQueries);
      } else {
        throw queryError;
      }
    }

    // Post-filter: if department filter is active, also include courses with department="all"
    // This is needed because Appwrite doesn't support OR queries
    let filteredDocs = result.documents;
    if (department && department !== 'all') {
      // Fetch "all" department courses and merge
      try {
        const allDeptQueries: string[] = [
          Query.equal('isPublished', true),
          Query.equal('department', 'all'),
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ];
        if (search) allDeptQueries.unshift(Query.search('title', search));
        if (category) allDeptQueries.unshift(Query.equal('categoryId', category));
        if (level) allDeptQueries.unshift(Query.equal('level', level));

        const allDeptResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, allDeptQueries);
        // Merge, avoiding duplicates (by $id)
        const existingIds = new Set(filteredDocs.map((d: any) => d.$id));
        const newDocs = allDeptResult.documents.filter((d: any) => !existingIds.has(d.$id));

        // If semester filter, apply it to "all" courses too
        if (semester && semester > 0) {
          const semesterMatching = newDocs.filter((d: any) => {
            const s = d.semester;
            return s === 0 || s === null || s === undefined || s === semester;
          });
          filteredDocs = [...filteredDocs, ...semesterMatching];
        } else {
          filteredDocs = [...filteredDocs, ...newDocs];
        }
      } catch (_) {
        // If fetching "all" dept fails, just use the primary result
      }
    }

    return c.json({ courses: filteredDocs.map(mapCourseDoc), total: result.total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /courses/:id — Course detail + curriculum
studentRoutes.get('/courses/:id', async (c) => {
  try {
    const courseId = c.req.param('id');

    // Fetch course document
    const course = await getDocument(c.env, APPWRITE_COLLECTIONS.COURSES, courseId);

    // Fetch videos for this course
    // Try 'courseId' first (newer attribute), fall back to 'course_id' (original schema)
    let videosResult;
    try {
      videosResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.VIDEOS, [
        Query.equal('courseId', courseId),
        Query.limit(200),
        Query.orderAsc('sort_order'),
      ]);
    } catch (videoQueryErr) {
      // Fallback: try course_id attribute and sort_order
      try {
        videosResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.VIDEOS, [
          Query.equal('course_id', courseId),
          Query.limit(200),
          Query.orderAsc('sort_order'),
        ]);
      } catch {
        // Last resort: no filter, just order
        videosResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.VIDEOS, [
          Query.limit(200),
        ]);
        // Filter manually by courseId or course_id
        videosResult.documents = videosResult.documents.filter((v: any) =>
          v.courseId === courseId || v.course_id === courseId
        );
      }
    }

    // Fetch instructor info
    let instructor = null;
    const instructorId = (course.instructor_id as string | undefined) || (course.instructorId as string | undefined);
    if (instructorId) {
      try {
        instructor = await getDocument(c.env, APPWRITE_COLLECTIONS.INSTRUCTORS, instructorId);
      } catch {
        // Instructor not found
      }
    }

    // Check enrollment and watch progress (if authenticated)
    let enrollment = null;
    let progress: unknown[] = [];

    const auth = await getStudentAuth(c);
    if (auth.authorized) {
      try {
        const enrollmentsResult = await listDocuments(
          c.env,
          APPWRITE_COLLECTIONS.ENROLLMENTS,
          [
            Query.equal('userId', auth.userId!),
            Query.equal('courseId', courseId),
            Query.limit(1),
          ]
        );
        if (enrollmentsResult.documents.length > 0) {
          enrollment = enrollmentsResult.documents[0];
        }
      } catch {
        // No enrollment
      }

      // Note: watch_progress collection has 'videoId' not 'courseId'
      // We'll fetch all user progress and let the frontend filter by course
      try {
        const progressResult = await listDocuments(
          c.env,
          APPWRITE_COLLECTIONS.WATCH_PROGRESS,
          [
            Query.equal('userId', auth.userId!),
            Query.limit(500),
          ]
        );
        progress = progressResult.documents;
      } catch {
        // No progress
      }
    }

    return c.json({
      course: mapCourseDoc(course),
      videos: videosResult.documents,
      instructor,
      enrollment,
      progress,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /enroll — Enroll in course (email verification required)
studentRoutes.post('/enroll', rateLimitMiddleware('enroll', RATE_LIMITS.enroll), async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const { courseId } = await c.req.json();
    if (!courseId) {
      return c.json({ error: 'courseId is required' }, 400);
    }

    // Check if already enrolled
    const existing = await listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
      Query.equal('userId', auth.userId!),
      Query.equal('courseId', courseId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      return c.json({ error: 'Already enrolled in this course' }, 400);
    }

    // Verify the course exists
    try {
      await getDocument(c.env, APPWRITE_COLLECTIONS.COURSES, courseId);
    } catch {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Create enrollment document — include all required Appwrite attributes
    const enrollment = await createDocument(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, {
      userId: auth.userId,
      courseId,
      progress: 0,
      completed: false,
      enrolledAt: new Date().toISOString(),
      email: auth.email || '',
      status: 'active',
    });

    // Log activity and check achievements (S5, S6)
    try {
      await c.env.DB.prepare(
        "INSERT INTO student_activity (user_id, activity_type, resource_type, resource_id, title, description) VALUES (?, 'enroll', 'course', ?, ?, 'Enrolled in course')"
      ).bind(auth.userId, courseId, courseId).run();

      // Record streak activity
      await recordActivity(c.env.DB, auth.userId!);

      // Check and unlock achievements
      const newAchievements = await checkAndUnlockAchievements(c.env.DB, auth.userId!, 'enroll');
      
      // Send achievement notifications
      if (newAchievements.length > 0) {
        const appwriteConfig = {
          endpoint: c.env.APPWRITE_ENDPOINT,
          projectId: c.env.APPWRITE_PROJECT_ID,
          databaseId: c.env.APPWRITE_DATABASE_ID,
          apiKey: c.env.APPWRITE_API_KEY,
        };
        const onesignalConfig = c.env.ONE_SIGNAL_APP_ID ? {
          appId: c.env.ONE_SIGNAL_APP_ID,
          restApiKey: c.env.ONE_SIGNAL_REST_API_KEY,
        } : undefined;
        
        for (const ach of newAchievements) {
          await notifyAchievementUnlocked(auth.userId!, ach.name, appwriteConfig, onesignalConfig, c.env.DB);
        }
      }
    } catch (e) {
      console.error('Activity/achievement logging failed:', e);
    }

    return c.json({ enrollment });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC DATA ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /categories — List categories
studentRoutes.get('/categories', async (c) => {
  try {
    const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.CATEGORIES, [
      Query.limit(100),
      Query.orderAsc('name'),
    ]);

    return c.json({ categories: result.documents, total: result.total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /instructors — List instructors
studentRoutes.get('/instructors', async (c) => {
  try {
    const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.INSTRUCTORS, [
      Query.limit(100),
      Query.orderAsc('name'),
    ]);

    return c.json({ instructors: result.documents, total: result.total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS ROUTE (no auth required — public)
// ═══════════════════════════════════════════════════════════════

// GET /announcements — List active announcements
studentRoutes.get('/announcements', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);
    const offset = parseInt(c.req.query('offset') || '0');

    // Fetch from D1 announcements table
    const { results } = await c.env.DB.prepare(
      'SELECT id, title, message, type, action_url, created_at, updated_at FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all<{
      id: number;
      title: string;
      message: string;
      type: string;
      action_url: string | null;
      created_at: string;
      updated_at: string;
    }>();

    // Get total count for pagination
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM announcements WHERE is_active = 1'
    ).first<{ total: number }>();

    const announcements = results.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      actionUrl: row.action_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return c.json({
      announcements,
      total: countResult?.total || 0,
      limit,
      offset,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// CONFIG ROUTE
// ═══════════════════════════════════════════════════════════════

// GET /config — Get ServerConfig
studentRoutes.get('/config', async (c) => {
  try {
    // First try KV cache
    const cachedConfig = await c.env.KV_CONFIG.get('server_config', 'json');
    if (cachedConfig) {
      return c.json(cachedConfig);
    }

    // Fall back to D1
    const { results } = await c.env.DB.prepare(
      'SELECT key, value FROM app_config'
    ).all<{ key: string; value: string }>();

    const configMap: Record<string, unknown> = {};
    for (const row of results) {
      try {
        configMap[row.key] = JSON.parse(row.value);
      } catch {
        configMap[row.key] = row.value;
      }
    }

    const config: ServerConfig = {
      featureToggles: { ...DEFAULT_CONFIG.featureToggles, ...(configMap.featureToggles as Partial<ServerConfig['featureToggles']>) },
      homePageSections: (configMap.homePageSections as ServerConfig['homePageSections']) || DEFAULT_CONFIG.homePageSections,
      sidebarVisibility: { ...DEFAULT_CONFIG.sidebarVisibility, ...(configMap.sidebarVisibility as Partial<ServerConfig['sidebarVisibility']>) },
      bottomNavTabs: (configMap.bottomNavTabs as ServerConfig['bottomNavTabs']) || DEFAULT_CONFIG.bottomNavTabs,
      topBarElements: { ...DEFAULT_CONFIG.topBarElements, ...(configMap.topBarElements as Partial<ServerConfig['topBarElements']>) },
      cardStyle: (configMap.cardStyle as ServerConfig['cardStyle']) || DEFAULT_CONFIG.cardStyle,
      contentProtection: { ...DEFAULT_CONFIG.contentProtection, ...(configMap.contentProtection as Partial<ServerConfig['contentProtection']>) },
      notificationSoundUrl: (configMap.notificationSoundUrl as string) || DEFAULT_CONFIG.notificationSoundUrl,
      corsOrigins: (configMap.corsOrigins as string[]) || DEFAULT_CONFIG.corsOrigins,
    };

    // Cache in KV
    await c.env.KV_CONFIG.put('server_config', JSON.stringify(config), {
      expirationTtl: 300,
    });

    return c.json(config);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// WATCH PROGRESS ROUTES (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /watch-progress — Get watch progress for a course or all courses
studentRoutes.get('/watch-progress', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const courseId = c.req.query('courseId');
    const queries = [
      Query.equal('userId', auth.userId!),
      Query.limit(200),
    ];

    if (courseId) {
      queries.push(Query.equal('courseId', courseId));
    }

    const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.WATCH_PROGRESS, queries);

    return c.json({ progress: result.documents, total: result.total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /watch-progress — Update watch progress (email verification required)
studentRoutes.post('/watch-progress', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const { videoId, courseId, progress, completed } = await c.req.json();

    if (!videoId || !courseId) {
      return c.json({ error: 'videoId and courseId are required' }, 400);
    }

    // Check if progress document already exists
    const existing = await listDocuments(c.env, APPWRITE_COLLECTIONS.WATCH_PROGRESS, [
      Query.equal('userId', auth.userId!),
      Query.equal('videoId', videoId),
      Query.limit(1),
    ]);

    const data: Record<string, unknown> = {
      progress: progress ?? 0,
      completed: completed ?? false,
      updatedAt: new Date().toISOString(),
    };

    if (existing.documents.length > 0) {
      // Update existing document
      const docId = (existing.documents[0] as Record<string, unknown> & { $id: string }).$id;
      const updated = await updateDocument(
        c.env,
        APPWRITE_COLLECTIONS.WATCH_PROGRESS,
        docId,
        data
      );

      // Log activity and update streak (S5, S6)
      try {
        await c.env.DB.prepare(
          "INSERT INTO student_activity (user_id, activity_type, resource_type, resource_id, title, description, metadata) VALUES (?, 'watch', 'video', ?, ?, 'Watched video', ?)"
        ).bind(auth.userId, videoId, `Video ${videoId}`, JSON.stringify({ courseId, progress: progress ?? 0, completed: completed ?? false })).run();

        await recordActivity(c.env.DB, auth.userId!);

        // Check achievements on video completion
        if (completed) {
          const newAchievements = await checkAndUnlockAchievements(c.env.DB, auth.userId!, 'watch');
          if (newAchievements.length > 0) {
            const appwriteConfig = {
              endpoint: c.env.APPWRITE_ENDPOINT,
              projectId: c.env.APPWRITE_PROJECT_ID,
              databaseId: c.env.APPWRITE_DATABASE_ID,
              apiKey: c.env.APPWRITE_API_KEY,
            };
            const onesignalConfig = c.env.ONE_SIGNAL_APP_ID ? {
              appId: c.env.ONE_SIGNAL_APP_ID,
              restApiKey: c.env.ONE_SIGNAL_REST_API_KEY,
            } : undefined;
            for (const ach of newAchievements) {
              await notifyAchievementUnlocked(auth.userId!, ach.name, appwriteConfig, onesignalConfig, c.env.DB);
            }
          }
        }
      } catch (e) {
        console.error('Activity/streak logging failed:', e);
      }

      return c.json({ progress: updated });
    } else {
      // Create new document
      const created = await createDocument(c.env, APPWRITE_COLLECTIONS.WATCH_PROGRESS, {
        userId: auth.userId,
        videoId,
        courseId,
        ...data,
      });

      // Log activity and update streak
      try {
        await c.env.DB.prepare(
          "INSERT INTO student_activity (user_id, activity_type, resource_type, resource_id, title, description, metadata) VALUES (?, 'watch', 'video', ?, ?, 'Started watching video', ?)"
        ).bind(auth.userId, videoId, `Video ${videoId}`, JSON.stringify({ courseId, progress: progress ?? 0 })).run();

        await recordActivity(c.env.DB, auth.userId!);
      } catch (e) {
        console.error('Activity/streak logging failed:', e);
      }

      return c.json({ progress: created });
    }
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// BOOKMARK ROUTES (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /bookmarks — List bookmarks
studentRoutes.get('/bookmarks', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.BOOKMARKS, [
      Query.equal('userId', auth.userId!),
      Query.limit(100),
      Query.orderDesc('$createdAt'),
    ]);

    return c.json({ bookmarks: result.documents, total: result.total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /bookmarks — Add bookmark (email verification required)
studentRoutes.post('/bookmarks', rateLimitMiddleware('api', RATE_LIMITS.api), async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const { courseId } = await c.req.json();
    if (!courseId) {
      return c.json({ error: 'courseId is required' }, 400);
    }

    // Check if already bookmarked
    const existing = await listDocuments(c.env, APPWRITE_COLLECTIONS.BOOKMARKS, [
      Query.equal('userId', auth.userId!),
      Query.equal('courseId', courseId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      return c.json({ error: 'Already bookmarked' }, 400);
    }

    const bookmark = await createDocument(c.env, APPWRITE_COLLECTIONS.BOOKMARKS, {
      userId: auth.userId,
      courseId,
    });

    return c.json({ bookmark });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// DELETE /bookmarks — Remove bookmark (email verification required)
studentRoutes.delete('/bookmarks', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const { courseId } = await c.req.json();
    if (!courseId) {
      return c.json({ error: 'courseId is required' }, 400);
    }

    // Find the bookmark
    const existing = await listDocuments(c.env, APPWRITE_COLLECTIONS.BOOKMARKS, [
      Query.equal('userId', auth.userId!),
      Query.equal('courseId', courseId),
      Query.limit(1),
    ]);

    if (existing.documents.length === 0) {
      return c.json({ error: 'Bookmark not found' }, 404);
    }

    const docId = (existing.documents[0] as Record<string, unknown> & { $id: string }).$id;
    await deleteDocument(c.env, APPWRITE_COLLECTIONS.BOOKMARKS, docId);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// SETTINGS ROUTES (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /settings — Get user settings
studentRoutes.get('/settings', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.USER_SETTINGS, [
      Query.equal('userId', auth.userId!),
      Query.limit(1),
    ]);

    if (result.documents.length === 0) {
      return c.json({ settings: null });
    }

    return c.json({ settings: result.documents[0] });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /settings — Update user settings
studentRoutes.put('/settings', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const data = await c.req.json();

    // Check if settings document exists
    const existing = await listDocuments(c.env, APPWRITE_COLLECTIONS.USER_SETTINGS, [
      Query.equal('userId', auth.userId!),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      // Update existing
      const docId = (existing.documents[0] as Record<string, unknown> & { $id: string }).$id;
      const updated = await updateDocument(
        c.env,
        APPWRITE_COLLECTIONS.USER_SETTINGS,
        docId,
        data
      );
      return c.json({ settings: updated });
    } else {
      // Create new
      const created = await createDocument(c.env, APPWRITE_COLLECTIONS.USER_SETTINGS, {
        userId: auth.userId,
        ...data,
      });
      return c.json({ settings: created });
    }
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// OTP ROUTES (no auth required for send, auth for verify)
// ═══════════════════════════════════════════════════════════════

// POST /auth/otp/send — Send OTP to email/phone
studentRoutes.post('/auth/otp/send', rateLimitMiddleware('otp', RATE_LIMITS.otp), async (c) => {
  try {
    const { target, type } = await c.req.json();
    if (!target) {
      return c.json({ error: 'Email or phone number is required' }, 400);
    }

    const otpType = type === 'phone' ? 'phone' : 'email';
    const result = await createAndSendOTP(
      c.env.DB,
      target,
      otpType as 'email' | 'phone',
      c.env.RESEND_API_KEY,
      c.env.RESEND_FROM_EMAIL
    );

    if (!result.success) {
      return c.json({ error: result.message }, 429);
    }

    return c.json({ success: true, message: result.message, expiresAt: result.expiresAt });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /auth/otp/verify — Verify OTP and create session
studentRoutes.post('/auth/otp/verify', rateLimitMiddleware('auth', RATE_LIMITS.auth), async (c) => {
  try {
    const { target, code } = await c.req.json();
    if (!target || !code) {
      return c.json({ error: 'Target and code are required' }, 400);
    }

    const result = await verifyOTP(c.env.DB, target, code);

    if (!result.valid) {
      return c.json({ error: result.message }, 400);
    }

    // OTP verified — find or create user session
    // For email OTP, find user by email in Appwrite
    try {
      const usersResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.USERS, [
        Query.equal('email', target),
        Query.limit(1),
      ]);

      if (usersResult.documents.length === 0) {
        return c.json({ error: 'User not found. Please sign up first.' }, 404);
      }

      const userDoc = usersResult.documents[0] as Record<string, unknown> & { $id: string };
      const userId = userDoc.$id;
      const email = userDoc.email as string;

      // Create D1 session
      const token = await createStudentSession(c.env, userId, email);

      const profile = await findUserProfile(c.env, userId);
      const user = {
        id: userId,
        email,
        name: (profile?.fullName as string) || (profile?.name as string) || null,
        role: (profile?.role as string) || 'student',
        phone: (profile?.phone as string) || null,
        institute: (profile?.institute as string) || null,
        technology: (profile?.technology as string) || null,
        semester: (profile?.semester as string) || null,
        avatarUrl: (profile?.avatarUrl as string) || null,
        fullName: (profile?.fullName as string) || null,
      };

      return c.json({ token, user, verified: true });
    } catch (error) {
      return c.json({ error: getErrorMessage(error) }, 500);
    }
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// STREAK ROUTES (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /streak — Get current streak info (no email verification required)
studentRoutes.get('/streak', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const streakInfo = await getStreakInfo(c.env.DB, auth.userId!);
    return c.json({ streak: streakInfo });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /streak/calendar — Get streak calendar
studentRoutes.get('/streak/calendar', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const days = parseInt(c.req.query('days') || '30');
    const calendar = await getStreakCalendar(c.env.DB, auth.userId!, days);
    return c.json({ calendar });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENT ROUTES (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /achievements — Get all achievements with unlock status
studentRoutes.get('/achievements', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await getUserAchievements(c.env.DB, auth.userId!);
    return c.json(result);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD ROUTE (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /leaderboard — Get weekly leaderboard based on activity (no email verification required)
studentRoutes.get('/leaderboard', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const technology = c.req.query('technology');
    const limit = parseInt(c.req.query('limit') || '20');

    // Step 1: Aggregate XP from D1 student_activity for the last 7 days
    let d1Query = `
      SELECT user_id, COUNT(*) as xp, MAX(created_at) as last_active
      FROM student_activity
      WHERE created_at >= datetime('now', '-7 days')
    `;
    const params: string[] = [];

    if (technology) {
      // Filter by technology: join with user_profiles that have matching technology
      d1Query += ` AND user_id IN (SELECT user_id FROM user_profiles WHERE technology = ?)`;
      params.push(technology);
    }

    d1Query += ' GROUP BY user_id ORDER BY xp DESC LIMIT ?';
    params.push(limit.toString());

    const d1Result = await c.env.DB.prepare(d1Query).bind(...params).all();

    if (d1Result.results.length === 0) {
      return c.json({ leaderboard: [], week: 'last_7_days' });
    }

    // Step 2: Fetch user profile data from Appwrite for those user_ids
    const userIds = (d1Result.results as any[]).map(r => r.user_id);
    const profileMap = new Map<string, { name: string; department: string; badge: string; avatarUrl: string }>();

    // Try to fetch profiles from user_profiles table in D1 first
    try {
      const placeholders = userIds.map(() => '?').join(',');
      const profileResult = await c.env.DB.prepare(
        `SELECT user_id, full_name, department, badge, avatar_url FROM user_profiles WHERE user_id IN (${placeholders})`
      ).bind(...userIds).all();

      for (const row of (profileResult.results as any[])) {
        profileMap.set(row.user_id, {
          name: row.full_name || 'Student',
          department: row.department || '',
          badge: row.badge || '',
          avatarUrl: row.avatar_url || '',
        });
      }
    } catch {
      // user_profiles table may not exist; fall back to Appwrite
    }

    // Step 3: For any user_ids not found in D1 user_profiles, try Appwrite
    const missingUserIds = userIds.filter(id => !profileMap.has(id));

    for (const userId of missingUserIds) {
      try {
        const profile = await findUserProfile(c.env, userId);
        profileMap.set(userId, {
          name: (profile?.fullName as string) || (profile?.full_name as string) || (profile?.name as string) || 'Student',
          department: (profile?.technology as string) || (profile?.institute as string) || '',
          badge: '',
          avatarUrl: (profile?.avatarUrl as string) || (profile?.avatar_url as string) || '',
        });
      } catch {
        profileMap.set(userId, {
          name: 'Student',
          department: '',
          badge: '',
          avatarUrl: '',
        });
      }
    }

    // Step 4: Merge D1 XP data with Appwrite profile data
    const leaderboard = (d1Result.results as any[]).map((row, idx) => {
      const profile = profileMap.get(row.user_id) || { name: 'Student', department: '', badge: '', avatarUrl: '' };
      return {
        rank: idx + 1,
        userId: row.user_id,
        name: profile.name,
        department: profile.department,
        xp: row.xp || 0,
        points: row.xp || 0,  // Frontend expects 'points' field
        streak: 0,
        coursesCompleted: 0,
        lastActive: row.last_active,
        badge: idx < 3 ? 'gold' : idx < 6 ? 'silver' : 'bronze',
        avatarUrl: profile.avatarUrl,
      };
    });

    return c.json({ leaderboard, week: 'last_7_days' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// ACTIVITY LOG ROUTE (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /activity — Get user's recent activity (no email verification required)
studentRoutes.get('/activity', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const result = await c.env.DB.prepare(
      'SELECT * FROM student_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(auth.userId!, limit).all();

    return c.json({ activities: result.results, total: result.results.length });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// STATS ROUTE (Bearer token required) — Profile stats
// ═══════════════════════════════════════════════════════════════

// GET /stats — Get user's learning stats (no email verification required)
studentRoutes.get('/stats', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get enrollment count from Appwrite
    let coursesEnrolled = 0;
    try {
      const enrollments = await listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
        Query.equal('userId', auth.userId!),
        Query.limit(0),
      ]);
      coursesEnrolled = enrollments.total;
    } catch { /* ignore */ }

    // Get streak info
    const streakInfo = await getStreakInfo(c.env.DB, auth.userId!);

    // Get total activity count (proxy for XP)
    const activityCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM student_activity WHERE user_id = ?'
    ).bind(auth.userId!).first();

    // Get total watch time from activity metadata
    const watchTime = await c.env.DB.prepare(
      "SELECT SUM(CAST(json_extract(metadata, '$.duration_seconds') AS REAL)) as total_seconds FROM student_activity WHERE user_id = ? AND activity_type = 'watch'"
    ).bind(auth.userId!).first();

    const totalSeconds = (watchTime?.total_seconds as number) || 0;
    const hoursWatched = Math.round(totalSeconds / 3600);

    return c.json({
      stats: {
        totalWatchTime: hoursWatched,
        totalVideosWatched: (activityCount?.count as number) || 0,
        totalCoursesEnrolled: coursesEnrolled,
        totalCoursesCompleted: 0,
        averageDailyWatchTime: 0,
        weeklyWatchTime: [],
        topCategories: [],
        coursesEnrolled,
        hoursWatched,
        certificates: 0,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        totalXp: (activityCount?.count as number) || 0,
        totalActivities: (activityCount?.count as number) || 0,
      },
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// VIDEO STREAM ROUTES (auth optional for free previews)
// ═══════════════════════════════════════════════════════════════

// ─── Helper: Detect video type from URL ───

type VideoType = 'youtube' | 'hls' | 'direct';

function detectVideoType(videoUrl: string): VideoType {
  const lower = videoUrl.toLowerCase();

  // YouTube detection
  if (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be')
  ) {
    return 'youtube';
  }

  // HLS detection
  if (lower.endsWith('.m3u8')) {
    return 'hls';
  }

  // Direct video files
  return 'direct';
}

// ─── Helper: Extract YouTube video ID ───

function extractYouTubeId(url: string): string | null {
  // Standard youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Short youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  // Embed URL youtube.com/embed/ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

// ─── Helper: Parse HTTP Range header ───

interface RangeInfo {
  start: number;
  end: number;
}

function parseRangeHeader(rangeHeader: string, fileSize: number): RangeInfo | null {
  const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!matches) return null;

  let start = matches[1] ? parseInt(matches[1], 10) : 0;
  let end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;

  // Clamp values
  if (start < 0) start = 0;
  if (end >= fileSize) end = fileSize - 1;
  if (start > end) return null;

  return { start, end };
}

// ─── Helper: Check video access control ───

interface AccessCheckResult {
  allowed: boolean;
  statusCode?: number;
  error?: string;
  isPreview: boolean;
  courseId?: string;
}

async function checkVideoAccess(
  env: Env,
  videoId: string,
  auth: { authorized: boolean; userId?: string; email?: string }
): Promise<AccessCheckResult> {
  // Step 1: Fetch video document from Appwrite
  let videoDoc: Record<string, unknown>;
  try {
    videoDoc = await getDocument(env, APPWRITE_COLLECTIONS.VIDEOS, videoId);
  } catch {
    return { allowed: false, statusCode: 404, error: 'Video not found', isPreview: false };
  }

  const isPreview = (videoDoc.isPreview as boolean) || false;
  const courseId = videoDoc.courseId as string | undefined;
  const isPublished = videoDoc.isPublished as boolean | undefined;

  // Unpublished video — deny access
  if (isPublished === false) {
    return { allowed: false, statusCode: 404, error: 'Video not found', isPreview, courseId };
  }

  // Step 2: If isPreview → allow access (no auth required)
  if (isPreview) {
    return { allowed: true, isPreview: true, courseId };
  }

  // Step 3: Non-preview video requires auth
  if (!auth.authorized) {
    return { allowed: false, statusCode: 401, error: 'Authentication required', isPreview: false, courseId };
  }

  // Step 4: Check enrollment for this course in Appwrite enrollments collection
  if (!courseId) {
    return { allowed: false, statusCode: 403, error: 'Video has no associated course', isPreview: false };
  }

  let enrollment = null;
  try {
    const enrollmentsResult = await listDocuments(env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
      Query.equal('userId', auth.userId!),
      Query.equal('courseId', courseId),
      Query.limit(1),
    ]);
    if (enrollmentsResult.documents.length > 0) {
      enrollment = enrollmentsResult.documents[0];
    }
  } catch {
    // Enrollment check failed
  }

  // Step 7: No enrollment → 403
  if (!enrollment) {
    return { allowed: false, statusCode: 403, error: 'Enrollment required', isPreview: false, courseId };
  }

  // Step 5: Check if course is free → allow
  let courseDoc: Record<string, unknown> | null = null;
  try {
    courseDoc = await getDocument(env, APPWRITE_COLLECTIONS.COURSES, courseId);
  } catch {
    // Course not found — still allow if enrolled
  }

  const coursePrice = courseDoc ? (courseDoc.price as number | null) : null;
  const isFreeCourse = !coursePrice || coursePrice === 0;

  if (isFreeCourse) {
    return { allowed: true, isPreview: false, courseId };
  }

  // Step 6: Paid course → check D1 user_packages for active package
  try {
    const activePackage = await env.DB.prepare(
      "SELECT id FROM user_packages WHERE user_id = ? AND course_id = ? AND status = 'active' LIMIT 1"
    ).bind(auth.userId, courseId).first();

    if (!activePackage) {
      return { allowed: false, statusCode: 402, error: 'Payment required', isPreview: false, courseId };
    }
  } catch {
    // D1 query failed — deny access to be safe
    return { allowed: false, statusCode: 402, error: 'Payment required', isPreview: false, courseId };
  }

  return { allowed: true, isPreview: false, courseId };
}

// GET /videos/:videoId/stream — Get video stream info
studentRoutes.get('/videos/:videoId/stream', rateLimitMiddleware('stream', RATE_LIMITS.stream), async (c) => {
  try {
    const videoId = c.req.param('videoId');

    // Check auth (optional for preview videos)
    const auth = await getStudentAuth(c);

    // Access control check
    const access = await checkVideoAccess(c.env, videoId, auth);
    if (!access.allowed) {
      return c.json({ error: access.error, accessGranted: false }, (access.statusCode || 403) as 401 | 402 | 403 | 404);
    }

    // Fetch video document for metadata
    const videoDoc = await getDocument(c.env, APPWRITE_COLLECTIONS.VIDEOS, videoId);
    const videoUrl = (videoDoc.videoUrl as string) || (videoDoc.video_url as string) || '';
    const title = (videoDoc.title as string) || '';
    const thumbnailUrl = (videoDoc.thumbnailUrl as string) || (videoDoc.thumbnail_url as string) || null;
    const storedVideoType = videoDoc.videoType as string | undefined;

    // Detect or use stored video type
    const type: VideoType = (storedVideoType === 'youtube' || storedVideoType === 'external')
      ? detectVideoType(videoUrl)
      : detectVideoType(videoUrl);

    // Generate URL based on type
    let url = '';
    let expiresIn: number | null = null;

    if (type === 'youtube') {
      const ytId = extractYouTubeId(videoUrl);
      if (ytId) {
        url = `https://www.youtube.com/embed/${ytId}`;
      } else {
        // Fallback: use the URL as-is
        url = videoUrl;
      }
    } else {
      // For HLS and direct — the client should use the /file endpoint
      // which proxies through our Worker. Build the proxy URL.
      const proxyBase = new URL(c.req.url).origin;
      url = `${proxyBase}/student/videos/${videoId}/file`;
      expiresIn = 3600; // Session-based, effectively valid until session expires
    }

    return c.json({
      videoId,
      type,
      url,
      title,
      expiresIn,
      thumbnailUrl,
      isPreview: access.isPreview,
      accessGranted: true,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /videos/:videoId/file — Proxy video file from R2 with Range support
studentRoutes.get('/videos/:videoId/file', rateLimitMiddleware('stream', RATE_LIMITS.stream), async (c) => {
  try {
    const videoId = c.req.param('videoId');

    // Check auth (optional for preview videos)
    const auth = await getStudentAuth(c);

    // Access control check
    const access = await checkVideoAccess(c.env, videoId, auth);
    if (!access.allowed) {
      return c.json({ error: access.error, accessGranted: false }, (access.statusCode || 403) as 401 | 402 | 403 | 404);
    }

    // Fetch video document for URL / R2 key
    const videoDoc = await getDocument(c.env, APPWRITE_COLLECTIONS.VIDEOS, videoId);
    const videoUrl = (videoDoc.videoUrl as string) || (videoDoc.video_url as string) || '';
    const detectedType = detectVideoType(videoUrl);

    // YouTube videos should not be proxied — redirect to embed
    if (detectedType === 'youtube') {
      const ytId = extractYouTubeId(videoUrl);
      if (ytId) {
        return c.redirect(`https://www.youtube.com/embed/${ytId}`);
      }
      return c.json({ error: 'Invalid YouTube URL' }, 400);
    }

    // For R2-hosted videos: proxy the file
    // videoUrl acts as the R2 key (e.g., "videos/course-id/video.mp4")
    const r2Key = videoUrl;
    const rangeHeader = c.req.header('Range');

    // First, try to get object info (HEAD) for Range support
    const objectInfo = await c.env.R2_VIDEOS.head(r2Key);

    if (!objectInfo) {
      return c.json({ error: 'Video file not found in storage' }, 404);
    }

    const fileSize = objectInfo.size;
    const contentType = objectInfo.httpMetadata?.contentType || 'video/mp4';

    // Common response headers for video streaming
    const baseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    };

    // Handle Range requests (video seeking)
    if (rangeHeader) {
      const range = parseRangeHeader(rangeHeader, fileSize);
      if (!range) {
        return new Response('Invalid Range', { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } });
      }

      const { start, end } = range;
      const contentLength = end - start + 1;

      // Fetch the specific range from R2
      const rangedObject = await c.env.R2_VIDEOS.get(r2Key, {
        range: { offset: start, length: contentLength },
      });

      if (!rangedObject) {
        return c.json({ error: 'Failed to fetch video range' }, 500);
      }

      return new Response(rangedObject.body, {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': contentLength.toString(),
        },
      });
    }

    // No Range header — return full file
    const r2Object = await getFile(c.env.R2_VIDEOS, r2Key);
    if (!r2Object) {
      return c.json({ error: 'Video file not found in storage' }, 404);
    }

    return new Response(r2Object.body, {
      status: 200,
      headers: {
        ...baseHeaders,
        'Content-Length': fileSize.toString(),
      },
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// FORGOT PASSWORD ROUTE (no auth required)
// ═══════════════════════════════════════════════════════════════

// POST /auth/forgot-password — Send password reset OTP
studentRoutes.post('/auth/forgot-password', rateLimitMiddleware('otp', RATE_LIMITS.otp), async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const result = await createAndSendOTP(
      c.env.DB,
      email,
      'email',
      c.env.RESEND_API_KEY,
      c.env.RESEND_FROM_EMAIL
    );

    if (!result.success) {
      return c.json({ error: result.message }, 429);
    }

    return c.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// SEARCH ROUTE (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /search — Search courses, videos, instructors
studentRoutes.get('/search', rateLimitMiddleware('api', RATE_LIMITS.api), async (c) => {
  try {
    const q = c.req.query('q') || c.req.query('query') || '';
    if (!q) {
      return c.json({ courses: [], videos: [], instructors: [], total: 0 });
    }

    // Search courses using Appwrite full-text search
    let courses: unknown[] = [];
    try {
      const coursesResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, [
        Query.search('title', q),
        Query.limit(20),
      ]);
      courses = coursesResult.documents;
    } catch {
      // Full-text search may not be available; fall back to empty
    }

    // Search instructors
    let instructors: unknown[] = [];
    try {
      const instructorsResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.INSTRUCTORS, [
        Query.search('name', q),
        Query.limit(10),
      ]);
      instructors = instructorsResult.documents;
    } catch {
      // Fall back
    }

    return c.json({
      courses,
      videos: [],
      instructors,
      total: courses.length + instructors.length,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// SESSIONS ROUTE (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /sessions — List active sessions
studentRoutes.get('/sessions', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await c.env.DB.prepare(
      'SELECT id, user_id, email, device_info, created_at, expires_at FROM student_sessions WHERE user_id = ? AND expires_at > datetime(\'now\') ORDER BY created_at DESC'
    ).bind(auth.userId).all();

    const sessions = result.results.map((s: any) => ({
      id: s.id,
      device: s.device_info || 'Unknown',
      browser: '',
      location: '',
      ip: '',
      lastActive: s.created_at,
      isCurrent: s.id === c.req.header('Authorization')?.substring(7),
    }));

    return c.json({ sessions });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// DELETE /sessions/:id — Revoke a session
studentRoutes.delete('/sessions/:id', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('id');
    await deleteStudentSession(c.env, sessionId);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// WEEKLY ACTIVITY ROUTE (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// GET /weekly-activity — Get weekly activity data
studentRoutes.get('/weekly-activity', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { results } = await c.env.DB.prepare(
      "SELECT date(created_at) as day, COUNT(*) as hours, 0 as videos FROM student_activity WHERE user_id = ? AND created_at >= datetime('now', '-7 days') GROUP BY date(created_at) ORDER BY day ASC"
    ).bind(auth.userId).all<{ day: string; hours: number; videos: number }>();

    const weeklyData = results.map((r) => ({
      day: r.day,
      hours: r.hours,
      videos: r.videos,
    }));

    return c.json({ weeklyData });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// FEEDBACK ROUTE (Bearer token required)
// ═══════════════════════════════════════════════════════════════

// POST /feedback — Submit feedback
studentRoutes.post('/feedback', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, rating, text } = await c.req.json();
    if (!text) {
      return c.json({ error: 'Feedback text is required' }, 400);
    }

    // Store feedback in student_activity for now
    await c.env.DB.prepare(
      "INSERT INTO student_activity (user_id, activity_type, resource_type, resource_id, title, description, metadata) VALUES (?, 'feedback', 'general', '0', ?, 'User feedback', ?)"
    ).bind(auth.userId, `Feedback: ${type || 'general'}`, JSON.stringify({ type: type || 'general', rating: rating || 0, text })).run();

    return c.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// Also fix the streak endpoint to wrap response in { streak: ... }
// The existing /streak route returns the streak info directly,
// but the frontend expects { streak: { currentStreak, longestStreak, ... } }

export default studentRoutes;
