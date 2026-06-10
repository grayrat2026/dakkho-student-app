/**
 * DAKKHO Certificate Routes — Cloudflare Workers + Hono
 *
 * Mounted at /student/certificates
 * Uses D1 for certificate storage, Appwrite for course/user data.
 * Generates HTML certificate template for PDF rendering.
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import { validateStudentSession } from '../lib/student-auth';
import {
  getDocument,
  listDocuments,
  Query,
} from '../lib/appwrite';
import { APPWRITE_COLLECTIONS } from '../lib/types';
import { getErrorMessage, generateId } from '../lib/utils';
import { recordActivity } from '../lib/streak';
import { checkAndUnlockAchievements } from '../lib/achievements';
import { notifyAchievementUnlocked } from '../lib/auto-notifications';

const certificateRoutes = new Hono<{ Bindings: Env }>();

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

// ─── Helper: Find user profile document ───

async function findUserProfile(
  env: Env,
  authUserId: string
): Promise<(Record<string, unknown> & { $id: string }) | null> {
  try {
    const doc = await getDocument(env, APPWRITE_COLLECTIONS.USERS, authUserId);
    return doc as Record<string, unknown> & { $id: string };
  } catch {
    // Not found by ID
  }

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

// ─── Helper: Generate unique certificate number ───

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DAK-${year}-${random}`;
}

// ─── Helper: Generate HTML certificate template ───

function generateCertificateHTML(data: {
  certificateNumber: string;
  userName: string;
  courseTitle: string;
  instructorName: string;
  completedAt: string;
  organizationName: string;
}): string {
  const formattedDate = new Date(data.completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Completion - ${data.certificateNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f0f0f0;
      font-family: 'Inter', sans-serif;
    }

    .certificate {
      width: 800px;
      height: 600px;
      background: linear-gradient(135deg, #fafafa 0%, #ffffff 50%, #fafafa 100%);
      border: 3px solid #1a1a2e;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid #c9a84c;
      pointer-events: none;
    }

    .certificate::after {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 1px solid #c9a84c;
      pointer-events: none;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
    }

    .org-name {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      color: #1a1a2e;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .certificate-title {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 2px;
    }

    .subtitle {
      font-size: 12px;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .content {
      text-align: center;
      margin: 30px 0;
    }

    .presented-to {
      font-size: 13px;
      color: #666;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 10px;
      border-bottom: 2px solid #c9a84c;
      display: inline-block;
      padding-bottom: 5px;
    }

    .completion-text {
      font-size: 14px;
      color: #444;
      line-height: 1.6;
      max-width: 500px;
      margin: 15px auto;
    }

    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: #c9a84c;
      margin: 10px 0;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding: 0 20px;
    }

    .signature-block {
      text-align: center;
      min-width: 150px;
    }

    .signature-line {
      width: 120px;
      border-top: 1px solid #1a1a2e;
      margin-bottom: 5px;
    }

    .signature-label {
      font-size: 11px;
      color: #666;
      letter-spacing: 1px;
    }

    .certificate-number {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #999;
      letter-spacing: 2px;
    }

    .date-text {
      font-size: 13px;
      color: #444;
      margin-top: 5px;
    }

    @media print {
      body {
        background: none;
      }
      .certificate {
        border: 3px solid #1a1a2e;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="org-name">${data.organizationName}</div>
      <div class="certificate-title">Certificate of Completion</div>
      <div class="subtitle">This is to certify that</div>
    </div>

    <div class="content">
      <div class="recipient-name">${data.userName}</div>
      <div class="completion-text">
        has successfully completed the course
      </div>
      <div class="course-name">${data.courseTitle}</div>
      <div class="completion-text">
        and has demonstrated proficiency in all required coursework and assessments.
      </div>
      <div class="date-text">Completed on ${formattedDate}</div>
    </div>

    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Instructor</div>
        <div class="signature-label" style="color: #1a1a2e; font-weight: 600;">${data.instructorName}</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Director</div>
        <div class="signature-label" style="color: #1a1a2e; font-weight: 600;">${data.organizationName}</div>
      </div>
    </div>

    <div class="certificate-number">Certificate No: ${data.certificateNumber}</div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// CERTIFICATE ROUTES
// ═══════════════════════════════════════════════════════════════

// GET / — List user's certificates
certificateRoutes.get('/', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC'
    ).bind(auth.userId).all();

    // Enrich with course info from Appwrite
    const certificates = await Promise.all(
      results.map(async (cert: any) => {
        let courseTitle = cert.course_title;
        try {
          const course = await getDocument(c.env, APPWRITE_COLLECTIONS.COURSES, cert.course_id);
          courseTitle = (course.title as string) || cert.course_title;
        } catch {
          // Use stored title as fallback
        }
        return {
          ...cert,
          courseTitle,
        };
      })
    );

    return c.json({ certificates });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /:courseId/generate — Generate certificate for a course (email verification required)
certificateRoutes.get('/:courseId/generate', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const courseId = c.req.param('courseId');

    // Step 1: Check enrollment
    const enrollmentsResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
      Query.equal('userId', auth.userId!),
      Query.equal('courseId', courseId),
      Query.limit(1),
    ]);

    if (enrollmentsResult.documents.length === 0) {
      return c.json({ error: 'You are not enrolled in this course' }, 400);
    }

    // Step 2: Verify all course videos are completed
    // Get all videos for the course
    const videosResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.VIDEOS, [
      Query.equal('courseId', courseId),
      Query.limit(200),
    ]);

    if (videosResult.documents.length === 0) {
      return c.json({ error: 'No videos found for this course' }, 400);
    }

    // Get user's watch progress for this course
    const progressResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.WATCH_PROGRESS, [
      Query.equal('userId', auth.userId!),
      Query.equal('courseId', courseId),
      Query.limit(200),
    ]);

    // Check all videos are completed
    const completedVideoIds = new Set(
      progressResult.documents
        .filter((doc: any) => doc.completed === true)
        .map((doc: any) => doc.videoId as string)
    );

    const allCompleted = videosResult.documents.every((video: any) =>
      completedVideoIds.has(video.$id || video.videoId)
    );

    if (!allCompleted) {
      const totalVideos = videosResult.documents.length;
      const completedVideos = videosResult.documents.filter((video: any) =>
        completedVideoIds.has(video.$id || video.videoId)
      ).length;

      return c.json({
        error: 'Not all course videos are completed',
        progress: {
          totalVideos,
          completedVideos,
          percentage: Math.round((completedVideos / totalVideos) * 100),
        },
      }, 400);
    }

    // Step 3: Check D1 certificates table if already exists
    const existing = await c.env.DB.prepare(
      'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?'
    ).bind(auth.userId, courseId).first();

    if (existing) {
      return c.json({
        certificate: existing,
        message: 'Certificate already exists for this course',
      });
    }

    // Step 4: Get course and user info for certificate
    const course = await getDocument(c.env, APPWRITE_COLLECTIONS.COURSES, courseId);
    const profile = await findUserProfile(c.env, auth.userId!);
    const userName =
      (profile?.fullName as string) ||
      (profile?.full_name as string) ||
      (profile?.name as string) ||
      auth.email!;

    // Get instructor name
    let instructorName = 'DAKKHO';
    const instructorId = course.instructorId as string | undefined;
    if (instructorId) {
      try {
        const instructor = await getDocument(c.env, APPWRITE_COLLECTIONS.INSTRUCTORS, instructorId);
        instructorName = (instructor.name as string) || 'DAKKHO';
      } catch {
        // Use default
      }
    }

    // Step 5: Generate unique certificate number
    let certNum = generateCertificateNumber();

    // Ensure uniqueness
    for (let attempts = 0; attempts < 5; attempts++) {
      const existingCert = await c.env.DB.prepare(
        'SELECT id FROM certificates WHERE certificate_number = ?'
      ).bind(certNum).first();
      if (!existingCert) break;
      certNum = generateCertificateNumber();
    }

    // Step 6: Store in D1 certificates table
    const certId = generateId();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO certificates (id, certificate_number, user_id, user_name, user_email, course_id, course_title, instructor_name, organization_name, issued_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      certId,
      certNum,
      auth.userId,
      userName,
      auth.email,
      courseId,
      (course.title as string) || 'Unknown Course',
      instructorName,
      'DAKKHO',
      now
    ).run();

    // Fetch the created certificate
    const certificate = await c.env.DB.prepare(
      'SELECT * FROM certificates WHERE certificate_number = ?'
    ).bind(certNum).first();

    // Step 7: Log activity and check achievements
    try {
      await c.env.DB.prepare(
        "INSERT INTO student_activity (user_id, activity_type, resource_type, resource_id, title, description, metadata) VALUES (?, 'certificate_earned', 'certificate', ?, ?, 'Earned certificate', ?)"
      ).bind(
        auth.userId,
        certNum,
        (course.title as string) || 'Course',
        JSON.stringify({
          certificateNumber: certNum,
          courseId,
          courseTitle: (course.title as string) || 'Unknown Course',
        })
      ).run();

      // Record streak activity
      await recordActivity(c.env.DB, auth.userId!);

      // Check and unlock achievements
      const newAchievements = await checkAndUnlockAchievements(c.env.DB, auth.userId!, 'certificate_earned');
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

    return c.json({
      certificate,
      message: 'Certificate generated successfully',
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /:certificateNumber/pdf — Get certificate as printable HTML
certificateRoutes.get('/:certificateNumber/pdf', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const certificateNumber = c.req.param('certificateNumber');

    // Get certificate from D1
    const certificate = await c.env.DB.prepare(
      'SELECT * FROM certificates WHERE certificate_number = ? AND user_id = ?'
    ).bind(certificateNumber, auth.userId).first();

    if (!certificate) {
      return c.json({ error: 'Certificate not found' }, 404);
    }

    const cert = certificate as any;

    // Generate HTML certificate
    const html = generateCertificateHTML({
      certificateNumber: cert.certificate_number,
      userName: cert.user_name,
      courseTitle: cert.course_title,
      instructorName: cert.instructor_name,
      completedAt: cert.issued_at,
      organizationName: cert.organization_name || 'DAKKHO',
    });

    // Return HTML with print-friendly content type
    return c.html(html);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default certificateRoutes;
