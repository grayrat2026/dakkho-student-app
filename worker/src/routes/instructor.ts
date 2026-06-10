/**
 * Instructor routes — All instructor-facing endpoints
 *
 * Migrated from Appwrite to D1 database.
 * All data access now uses D1 SQL queries instead of Appwrite SDK.
 *
 * Auth:
 *   - instructorAuth ONLY: /auth/check, /auth/logout, /change-password
 *   - instructorOrAdmin: everything else
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import {
  instructorAuthMiddleware,
  instructorOrAdminMiddleware,
  type InstructorOrAdminAuthVariables,
} from '../lib/instructor-auth-middleware';
import { validateInstructorSession, deleteInstructorSession } from '../lib/instructor-auth';
import { authenticateUser, hashPassword, verifyPassword } from '../lib/auth-password';
import { getErrorMessage, generateId, getSessionExpiry } from '../lib/utils';
import { getPublicUrl } from '../lib/r2';

const instructorRoutes = new Hono<{ Bindings: Env; Variables: InstructorOrAdminAuthVariables }>();

// ─── Helper: Format instructor row for backward compatibility ───

function formatInstructorRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    $id: row.id,
    avatarUrl: row.avatar_url || row.avatarUrl,
  };
}

// ─── Helper: Format course row for backward compatibility ───

function formatCourseRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    $id: row.id,
    $createdAt: row.created_at,
    isPublished: row.is_published,
    price: row.price_bdt,
    instructorId: row.instructor_id,
  };
}

// ─── Helper: Format video row for backward compatibility ───

function formatVideoRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    courseId: row.course_id,
    videoUrl: row.video_url,
  };
}

// ─── Helper: Format enrollment row for backward compatibility ───

function formatEnrollmentRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    courseId: row.course_id,
    userId: row.user_id,
  };
}

// ═══════════════════════════════════════════════════
// AUTH ROUTES (instructorAuth ONLY)
// ═══════════════════════════════════════════════════

// GET /auth/check — Verify instructor session
instructorRoutes.get('/auth/check', instructorAuthMiddleware, async (c) => {
  try {
    const instructorId = c.get('instructorId');
    const instructorEmail = c.get('instructorEmail');
    const instructorName = c.get('instructorName');
    const instructorAvatarUrl = c.get('instructorAvatarUrl');

    return c.json({
      authenticated: true,
      user: {
        id: instructorId,
        email: instructorEmail,
        name: instructorName,
        avatarUrl: instructorAvatarUrl,
        role: 'instructor',
      },
    });
  } catch (error) {
    return c.json({ authenticated: false }, 401);
  }
});

// DELETE /auth/logout — Instructor logout
instructorRoutes.delete('/auth/logout', instructorAuthMiddleware, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7) || '';

    await deleteInstructorSession(c.env, token);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /change-password — Change instructor password (instructorAuth ONLY)
instructorRoutes.post('/change-password', instructorAuthMiddleware, async (c) => {
  try {
    const instructorId = c.get('instructorId');
    const instructorEmail = c.get('instructorEmail');
    const { current_password, new_password } = await c.req.json<{ current_password: string; new_password: string }>();

    if (!current_password || !new_password) {
      return c.json({ error: 'Current and new password are required' }, 400);
    }

    if (new_password.length < 8) {
      return c.json({ error: 'New password must be at least 8 characters' }, 400);
    }

    // Verify current password using D1 lookup + verifyPassword
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, password_migrated FROM users WHERE id = ?'
    ).bind(instructorId).first<{ id: string; email: string; password_hash: string | null; password_migrated: number }>();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (user.password_hash && user.password_migrated === 1) {
      // Fully migrated — verify with D1 password hash
      const valid = await verifyPassword(current_password, user.password_hash);
      if (!valid) {
        return c.json({ error: 'Current password is incorrect' }, 400);
      }
    } else {
      // Not migrated yet — use authenticateUser which falls back to Appwrite
      const authResult = await authenticateUser(c.env, instructorEmail, current_password);
      if (!authResult.success) {
        return c.json({ error: 'Current password is incorrect' }, 400);
      }
    }

    // Hash the new password and update in D1
    const newPasswordHash = await hashPassword(new_password);
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, password_migrated = 1, updated_at = ? WHERE id = ?'
    ).bind(newPasswordHash, new Date().toISOString(), instructorId).run();

    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════
// PROFILE ROUTES (instructorOrAdmin)
// ═══════════════════════════════════════════════════

// GET /profile — Get instructor profile from D1 instructors table
instructorRoutes.get('/profile', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      // Admin may query by query param
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const row = await c.env.DB.prepare(
      'SELECT * FROM instructors WHERE id = ?'
    ).bind(instructorId).first();

    if (!row) {
      return c.json({ error: 'Instructor profile not found' }, 404);
    }

    const profile = formatInstructorRow(row as Record<string, unknown>);

    return c.json({ success: true, profile });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /profile — Update instructor profile (name, bio, avatar, etc.)
instructorRoutes.put('/profile', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const body = await c.req.json();

    // Map camelCase field names to snake_case D1 columns
    const fieldMapping: Record<string, string> = {
      name: 'name',
      bio: 'bio',
      avatar: 'avatar_url',
      avatarUrl: 'avatar_url',
      specialization: 'specialization',
      phone: 'phone',
      department: 'department',
    };

    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [bodyField, dbColumn] of Object.entries(fieldMapping)) {
      if (body[bodyField] !== undefined) {
        setClauses.push(`${dbColumn} = ?`);
        params.push(body[bodyField]);
      }
    }

    if (setClauses.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    // Always update updated_at
    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(instructorId);

    await c.env.DB.prepare(
      `UPDATE instructors SET ${setClauses.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    // If name was updated, also update the D1 session
    if ((body.name !== undefined) && authRole === 'instructor') {
      try {
        await c.env.DB.prepare(
          'UPDATE instructor_sessions SET name = ? WHERE user_id = ? AND is_active = 1'
        ).bind(String(body.name), instructorId).run();
      } catch {}
    }

    // If avatar was updated, also update the D1 session
    if ((body.avatarUrl !== undefined || body.avatar !== undefined) && authRole === 'instructor') {
      try {
        const avatarVal = body.avatarUrl || body.avatar;
        await c.env.DB.prepare(
          'UPDATE instructor_sessions SET avatar_url = ? WHERE user_id = ? AND is_active = 1'
        ).bind(String(avatarVal), instructorId).run();
      } catch {}
    }

    // Fetch and return the updated profile
    const updatedRow = await c.env.DB.prepare(
      'SELECT * FROM instructors WHERE id = ?'
    ).bind(instructorId).first();

    const profile = formatInstructorRow(updatedRow as Record<string, unknown>);

    return c.json({ success: true, profile });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /profile/avatar — Upload instructor avatar to R2
instructorRoutes.post('/profile/avatar', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const formData = await c.req.formData();
    const avatarEntry = formData.get('avatar');
    if (!avatarEntry || typeof avatarEntry === 'string') {
      return c.json({ error: 'No avatar file provided' }, 400);
    }
    const file = avatarEntry as unknown as Blob & { name?: string; type?: string };

    // Clean up old avatar from R2
    try {
      const existingRow = await c.env.DB.prepare(
        'SELECT avatar_url FROM instructors WHERE id = ?'
      ).bind(instructorId).first<{ avatar_url: string | null }>();

      const oldAvatarUrl = existingRow?.avatar_url;
      if (oldAvatarUrl) {
        const uploadMatch = oldAvatarUrl.match(/\/upload\/avatars\/(.+)$/);
        if (uploadMatch?.[1]) {
          await c.env.R2_AVATARS.delete(uploadMatch[1]);
        }
      }
    } catch {}

    // Upload to R2 avatars bucket
    const key = `instructor/${instructorId}/${Date.now()}-${file.name || 'avatar'}`;
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_AVATARS.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type || 'image/png' },
    });

    const avatarUrl = await getPublicUrl(c.env, 'avatars', key);

    // Update D1 instructors table
    await c.env.DB.prepare(
      'UPDATE instructors SET avatar_url = ?, updated_at = ? WHERE id = ?'
    ).bind(avatarUrl, new Date().toISOString(), instructorId).run();

    // Update D1 session
    if (authRole === 'instructor') {
      try {
        await c.env.DB.prepare(
          'UPDATE instructor_sessions SET avatar_url = ? WHERE user_id = ? AND is_active = 1'
        ).bind(avatarUrl, instructorId).run();
      } catch {}
    }

    return c.json({ success: true, avatar_url: avatarUrl });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════
// COURSES ROUTES (instructorOrAdmin)
// ═══════════════════════════════════════════════════

// GET /courses — List courses assigned to this instructor
instructorRoutes.get('/courses', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    // Query D1 courses where instructor_id matches
    const result = await c.env.DB.prepare(
      'SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(instructorId, limit, offset).all();

    // Also check course_subjects D1 table for courses assigned to this instructor
    let coursesFromSubjects: string[] = [];
    try {
      const subjectResult = await c.env.DB.prepare(
        'SELECT DISTINCT course_id FROM course_subjects WHERE instructor_id = ?'
      ).bind(instructorId).all<{ course_id: string }>();
      coursesFromSubjects = subjectResult.results.map(r => r.course_id);
    } catch {}

    // Merge with course_subjects results — add courses not already in the main result
    const existingCourseIds = new Set(result.results.map((r: any) => r.id));
    const additionalCourses: any[] = [];
    for (const cid of coursesFromSubjects) {
      if (!existingCourseIds.has(cid)) {
        try {
          const course = await c.env.DB.prepare(
            'SELECT * FROM courses WHERE id = ?'
          ).bind(cid).first();
          if (course) {
            additionalCourses.push(course);
          }
        } catch {}
      }
    }

    // Get total count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM courses WHERE instructor_id = ?'
    ).bind(instructorId).first<{ total: number }>();
    const total = (countResult?.total || 0) + additionalCourses.length;

    // Format all course rows
    const allCourses = [
      ...result.results.map((r: any) => formatCourseRow(r)),
      ...additionalCourses.map((r: any) => formatCourseRow(r)),
    ];

    return c.json({ courses: allCourses, total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /courses/:id — Get course detail with student count
instructorRoutes.get('/courses/:id', instructorOrAdminMiddleware, async (c) => {
  try {
    const courseId = c.req.param('id');

    const row = await c.env.DB.prepare(
      'SELECT * FROM courses WHERE id = ?'
    ).bind(courseId).first();

    if (!row) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Get student count from enrollments
    let studentCount = 0;
    try {
      const enrollResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as total FROM enrollments WHERE course_id = ?'
      ).bind(courseId).first<{ total: number }>();
      studentCount = enrollResult?.total || 0;
    } catch {}

    const course = formatCourseRow(row as Record<string, unknown>);

    return c.json({
      success: true,
      course,
      studentCount,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /courses/:id/students — List enrolled students
instructorRoutes.get('/courses/:id/students', instructorOrAdminMiddleware, async (c) => {
  try {
    const courseId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get enrollments for this course
    const enrollResult = await c.env.DB.prepare(
      'SELECT * FROM enrollments WHERE course_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(courseId, limit, offset).all();

    // Get total count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM enrollments WHERE course_id = ?'
    ).bind(courseId).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Enrich with student user data from D1
    const enrichedStudents = [];
    for (const enrollment of enrollResult.results as Array<Record<string, unknown>>) {
      const userId = enrollment.user_id as string | undefined;
      let studentProfile: Record<string, unknown> | null = null;
      if (userId) {
        try {
          const userRow = await c.env.DB.prepare(
            'SELECT id, name, email, avatar_url FROM users WHERE id = ?'
          ).bind(userId).first();
          if (userRow) {
            studentProfile = userRow as Record<string, unknown>;
          }
        } catch {}
      }
      const formattedEnrollment = formatEnrollmentRow(enrollment);
      enrichedStudents.push({
        ...formattedEnrollment,
        student: studentProfile ? {
          id: studentProfile.id || userId,
          name: studentProfile.name || '',
          email: studentProfile.email || '',
          avatarUrl: studentProfile.avatar_url || '',
        } : { id: userId, name: 'Unknown', email: '', avatarUrl: '' },
      });
    }

    return c.json({ students: enrichedStudents, total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /courses/:id/videos — List videos for a course
instructorRoutes.get('/courses/:id/videos', instructorOrAdminMiddleware, async (c) => {
  try {
    const courseId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const result = await c.env.DB.prepare(
      'SELECT * FROM videos WHERE course_id = ? ORDER BY sort_order ASC LIMIT ? OFFSET ?'
    ).bind(courseId, limit, offset).all();

    // Get total count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM videos WHERE course_id = ?'
    ).bind(courseId).first<{ total: number }>();
    const total = countResult?.total || 0;

    const videos = result.results.map((r: any) => formatVideoRow(r));

    return c.json({ videos, total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /courses/:id/progress — Aggregate student progress
instructorRoutes.get('/courses/:id/progress', instructorOrAdminMiddleware, async (c) => {
  try {
    const courseId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get enrollments for this course
    const enrollResult = await c.env.DB.prepare(
      'SELECT * FROM enrollments WHERE course_id = ? LIMIT ? OFFSET ?'
    ).bind(courseId, limit, offset).all();

    const totalEnrollments = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM enrollments WHERE course_id = ?'
    ).bind(courseId).first<{ total: number }>();

    // Get video count for this course
    let videoCount = 0;
    try {
      const videoCountResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as total FROM videos WHERE course_id = ?'
      ).bind(courseId).first<{ total: number }>();
      videoCount = videoCountResult?.total || 0;
    } catch {}

    // Get watch progress for each student
    const progressList = [];
    for (const enrollment of enrollResult.results as Array<Record<string, unknown>>) {
      const userId = enrollment.user_id as string | undefined;
      let completedVideos = 0;
      let totalWatchTime = 0;

      if (userId) {
        try {
          // Get aggregated watch progress for this user + course
          const wpStats = await c.env.DB.prepare(
            'SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed, COALESCE(SUM(watch_time), 0) as total_watch FROM watch_progress WHERE user_id = ? AND course_id = ?'
          ).bind(userId, courseId).first<{ total: number; completed: number; total_watch: number }>();

          completedVideos = wpStats?.completed || 0;
          totalWatchTime = wpStats?.total_watch || 0;
        } catch {}
      }

      const progressPercent = videoCount > 0 ? Math.round((completedVideos / videoCount) * 100) : 0;

      progressList.push({
        userId,
        enrollmentId: enrollment.id,
        completedVideos,
        totalVideos: videoCount,
        progressPercent,
        totalWatchTime,
      });
    }

    // Aggregate stats
    const avgProgress = progressList.length > 0
      ? Math.round(progressList.reduce((sum, p) => sum + p.progressPercent, 0) / progressList.length)
      : 0;

    return c.json({
      success: true,
      courseId,
      totalStudents: totalEnrollments?.total || 0,
      totalVideos: videoCount,
      averageProgress: avgProgress,
      progress: progressList,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /courses/:id/analytics — Course analytics
instructorRoutes.get('/courses/:id/analytics', instructorOrAdminMiddleware, async (c) => {
  try {
    const courseId = c.req.param('id');

    // Get enrollment count from D1
    let enrollmentCount = 0;
    try {
      const enrollResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as total FROM enrollments WHERE course_id = ?'
      ).bind(courseId).first<{ total: number }>();
      enrollmentCount = enrollResult?.total || 0;
    } catch {}

    // Get video count from D1
    let videoCount = 0;
    try {
      const videoResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as total FROM videos WHERE course_id = ?'
      ).bind(courseId).first<{ total: number }>();
      videoCount = videoResult?.total || 0;
    } catch {}

    // Get recent payments from D1
    let revenue = 0;
    let paymentCount = 0;
    try {
      const paymentStats = await c.env.DB.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE course_id = ? AND status = 'completed'"
      ).bind(courseId).first<{ count: number; total: number }>();
      paymentCount = paymentStats?.count || 0;
      revenue = paymentStats?.total || 0;
    } catch {}

    // Get average rating from D1 instructor reviews
    let avgRating = 0;
    let reviewCount = 0;
    try {
      const ratingStats = await c.env.DB.prepare(
        'SELECT AVG(rating) as avg, COUNT(*) as count FROM instructor_reviews WHERE course_id = ?'
      ).bind(courseId).first<{ avg: number; count: number }>();
      avgRating = ratingStats?.avg ? Math.round(ratingStats.avg * 10) / 10 : 0;
      reviewCount = ratingStats?.count || 0;
    } catch {}

    return c.json({
      success: true,
      analytics: {
        courseId,
        enrollmentCount,
        videoCount,
        revenue,
        paymentCount,
        avgRating,
        reviewCount,
      },
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════
// SCHEDULE ROUTES (instructorOrAdmin)
// ═══════════════════════════════════════════════════

// GET /schedule — Get upcoming schedule from D1 live_class_schedules
instructorRoutes.get('/schedule', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const limit = parseInt(c.req.query('limit') || '20');

    const result = await c.env.DB.prepare(
      "SELECT * FROM live_class_schedules WHERE instructor_id = ? AND scheduled_at > datetime('now') AND is_active = 1 ORDER BY scheduled_at ASC LIMIT ?"
    ).bind(instructorId, limit).all();

    return c.json({ success: true, schedule: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════
// REVIEWS ROUTES (instructorOrAdmin)
// ═══════════════════════════════════════════════════

// GET /reviews — Get reviews from D1 instructor_reviews
instructorRoutes.get('/reviews', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    const reviews = await c.env.DB.prepare(
      'SELECT * FROM instructor_reviews WHERE instructor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(instructorId, limit, offset).all();

    // Rating stats
    const stats = await c.env.DB.prepare(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM instructor_reviews WHERE instructor_id = ?
    `).bind(instructorId).first();

    const totalReviews = (stats?.total_reviews as number) || 0;
    const distribution = {
      5: (stats?.five_star as number) || 0,
      4: (stats?.four_star as number) || 0,
      3: (stats?.three_star as number) || 0,
      2: (stats?.two_star as number) || 0,
      1: (stats?.one_star as number) || 0,
    };

    return c.json({
      success: true,
      reviews: reviews.results,
      stats: {
        average_rating: totalReviews > 0 ? Math.round((stats?.average_rating as number) * 10) / 10 : 0,
        total_reviews: totalReviews,
        rating_distribution: distribution,
      },
      page,
      limit,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════
// NOTIFICATIONS ROUTES (instructorOrAdmin)
// ═══════════════════════════════════════════════════

// GET /notifications — Get notifications for instructor from D1
instructorRoutes.get('/notifications', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const unreadOnly = c.req.query('unread') === 'true';

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: unknown[] = [instructorId];

    if (unreadOnly) {
      query += ' AND read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const countParams: unknown[] = [instructorId];
    if (unreadOnly) {
      countQuery += ' AND read = 0';
    }
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const total = countResult?.total || 0;

    return c.json({ success: true, notifications: result.results, total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /notifications/:id/read — Mark notification as read in D1
instructorRoutes.put('/notifications/:id/read', instructorOrAdminMiddleware, async (c) => {
  try {
    const notificationId = c.req.param('id');

    await c.env.DB.prepare(
      'UPDATE notifications SET read = 1 WHERE id = ?'
    ).bind(notificationId).run();

    return c.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════
// SUPPORT TICKET ROUTES (instructorOrAdmin)
// ═══════════════════════════════════════════════════

// POST /support/tickets — Create support ticket
instructorRoutes.post('/support/tickets', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;
    let instructorEmail: string;
    let instructorName: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      instructorEmail = c.req.query('instructorEmail') || '';
      instructorName = c.req.query('instructorName') || '';
    } else {
      instructorId = c.get('instructorId');
      instructorEmail = c.get('instructorEmail');
      instructorName = c.get('instructorName');
    }

    const body = await c.req.json();
    const { category, subject, description, priority } = body;

    if (!category || !subject || !description) {
      return c.json({ error: 'category, subject, and description are required' }, 400);
    }

    const ticketId = `TK-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO support_tickets (ticket_id, user_id, name, email, category, subject, description, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `).bind(
      ticketId,
      instructorId,
      instructorName,
      instructorEmail,
      category,
      subject,
      description,
      priority || 'medium',
      now,
      now
    ).run();

    return c.json({
      success: true,
      ticket: {
        ticketId,
        status: 'open',
        createdAt: now,
      },
    }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /support/tickets — List instructor's tickets
instructorRoutes.get('/support/tickets', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const status = c.req.query('status');

    let query = 'SELECT * FROM support_tickets WHERE user_id = ?';
    const params: unknown[] = [instructorId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, tickets: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════
// DASHBOARD ROUTE (instructorOrAdmin)
// ═══════════════════════════════════════════════════

// GET /dashboard — Dashboard stats
instructorRoutes.get('/dashboard', instructorOrAdminMiddleware, async (c) => {
  try {
    const authRole = c.get('authRole');
    let instructorId: string;

    if (authRole === 'admin') {
      instructorId = c.req.query('instructorId') || '';
      if (!instructorId) {
        return c.json({ error: 'instructorId query param required for admin access' }, 400);
      }
    } else {
      instructorId = c.get('instructorId');
    }

    // Get course count from D1 courses table
    let courseCount = 0;
    try {
      const courseCountResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as total FROM courses WHERE instructor_id = ?'
      ).bind(instructorId).first<{ total: number }>();
      courseCount = courseCountResult?.total || 0;
    } catch {}

    // Also count from course_subjects
    let subjectCourseCount = 0;
    try {
      const subjectResult = await c.env.DB.prepare(
        'SELECT COUNT(DISTINCT course_id) as count FROM course_subjects WHERE instructor_id = ?'
      ).bind(instructorId).first<{ count: number }>();
      subjectCourseCount = subjectResult?.count || 0;
    } catch {}
    courseCount = Math.max(courseCount, subjectCourseCount);

    // Total students across all courses — get all course IDs for this instructor
    let totalStudents = 0;
    try {
      // Get enrollment count for courses where instructor_id matches in courses table
      const studentCountResult = await c.env.DB.prepare(`
        SELECT COUNT(DISTINCT e.user_id) as total
        FROM enrollments e
        INNER JOIN courses c ON e.course_id = c.id
        WHERE c.instructor_id = ?
      `).bind(instructorId).first<{ total: number }>();
      totalStudents = studentCountResult?.total || 0;

      // Also add students from course_subjects assigned courses
      const subjectStudentResult = await c.env.DB.prepare(`
        SELECT COUNT(DISTINCT e.user_id) as total
        FROM enrollments e
        INNER JOIN course_subjects cs ON e.course_id = cs.course_id
        WHERE cs.instructor_id = ?
      `).bind(instructorId).first<{ total: number }>();
      totalStudents = Math.max(totalStudents, subjectStudentResult?.total || 0);
    } catch {}

    // Upcoming live classes
    let upcomingClasses = 0;
    try {
      const classResult = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM live_class_schedules WHERE instructor_id = ? AND scheduled_at > datetime('now') AND is_active = 1"
      ).bind(instructorId).first<{ count: number }>();
      upcomingClasses = classResult?.count || 0;
    } catch {}

    // Review stats
    let avgRating = 0;
    let totalReviews = 0;
    try {
      const ratingStats = await c.env.DB.prepare(
        'SELECT AVG(rating) as avg, COUNT(*) as count FROM instructor_reviews WHERE instructor_id = ?'
      ).bind(instructorId).first<{ avg: number; count: number }>();
      avgRating = ratingStats?.avg ? Math.round(ratingStats.avg * 10) / 10 : 0;
      totalReviews = ratingStats?.count || 0;
    } catch {}

    // Revenue — get all course IDs for this instructor and sum payments
    let totalRevenue = 0;
    try {
      // Revenue from courses where instructor_id matches directly
      const directRevenue = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        INNER JOIN courses c ON p.course_id = c.id
        WHERE c.instructor_id = ? AND p.status = 'completed'
      `).bind(instructorId).first<{ total: number }>();
      totalRevenue = directRevenue?.total || 0;

      // Also add revenue from course_subjects assigned courses
      const subjectRevenue = await c.env.DB.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        INNER JOIN course_subjects cs ON p.course_id = cs.course_id
        WHERE cs.instructor_id = ? AND p.status = 'completed'
      `).bind(instructorId).first<{ total: number }>();
      totalRevenue = Math.max(totalRevenue, subjectRevenue?.total || 0);
    } catch {}

    return c.json({
      success: true,
      dashboard: {
        courseCount,
        totalStudents,
        upcomingClasses,
        avgRating,
        totalReviews,
        totalRevenue,
      },
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default instructorRoutes;
