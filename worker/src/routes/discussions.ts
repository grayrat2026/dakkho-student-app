/**
 * DAKKHO Discussion Routes — Cloudflare Workers + Hono
 *
 * Mounted at /student/discussions
 * Uses Appwrite for discussion threads and replies.
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import {
  validateStudentSession,
} from '../lib/student-auth';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  Query,
} from '../lib/appwrite';
import { APPWRITE_COLLECTIONS } from '../lib/types';
import { getErrorMessage } from '../lib/utils';

const discussionRoutes = new Hono<{ Bindings: Env }>();

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

// ─── Helper: Get user name from profile ───

async function getUserName(env: Env, userId: string): Promise<string> {
  const profile = await findUserProfile(env, userId);
  return (
    (profile?.fullName as string) ||
    (profile?.full_name as string) ||
    (profile?.name as string) ||
    'Anonymous'
  );
}

// ─── Helper: Check if user is admin ───

async function isUserAdmin(env: Env, userId: string): Promise<boolean> {
  try {
    const profile = await findUserProfile(env, userId);
    return (profile?.role as string) === 'admin';
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// DISCUSSION THREAD ROUTES
// ═══════════════════════════════════════════════════════════════

// GET / — List discussion threads (optionally filtered by courseId)
discussionRoutes.get('/', async (c) => {
  try {
    const courseId = c.req.query('courseId');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    if (courseId) {
      queries.unshift(Query.equal('courseId', courseId));
    }

    // Pin pinned threads first — we sort in application code
    const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, queries);

    // Sort: pinned first, then by creation date
    const sorted = result.documents.sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
    });

    return c.json({
      discussions: sorted,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /:id — Get single discussion thread with replies
discussionRoutes.get('/:id', async (c) => {
  try {
    const threadId = c.req.param('id');

    // Get the thread
    const thread = await getDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId);

    // Get replies for this thread
    const repliesResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.DISCUSSION_REPLIES, [
      Query.equal('threadId', threadId),
      Query.limit(200),
      Query.orderAsc('$createdAt'),
    ]);

    return c.json({
      thread,
      replies: repliesResult.documents,
      totalReplies: repliesResult.total,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 404);
  }
});

// POST / — Create a new discussion thread (email verification required)
discussionRoutes.post('/', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const { courseId, title, body, tags } = await c.req.json();

    if (!courseId || !title || !body) {
      return c.json({ error: 'courseId, title, and body are required' }, 400);
    }

    // Verify the course exists
    try {
      await getDocument(c.env, APPWRITE_COLLECTIONS.COURSES, courseId);
    } catch {
      return c.json({ error: 'Course not found' }, 404);
    }

    const userName = await getUserName(c.env, auth.userId!);

    const discussion = await createDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, {
      courseId,
      userId: auth.userId,
      userName,
      title,
      body,
      tags: tags || [],
      likes: 0,
      replies: 0,
      isPinned: false,
      isClosed: false,
    });

    return c.json({ discussion }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /:id/reply — Reply to a discussion thread (email verification required)
discussionRoutes.post('/:id/reply', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const threadId = c.req.param('id');
    const { body } = await c.req.json();

    if (!body) {
      return c.json({ error: 'body is required' }, 400);
    }

    // Verify the thread exists
    const thread = await getDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId);
    if ((thread as any).isClosed) {
      return c.json({ error: 'This discussion is closed for new replies' }, 400);
    }

    const userName = await getUserName(c.env, auth.userId!);

    const reply = await createDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSION_REPLIES, {
      threadId,
      userId: auth.userId,
      userName,
      body,
      likes: 0,
    });

    // Increment reply count on thread
    const currentReplies = ((thread as any).replies as number) || 0;
    await updateDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId, {
      replies: currentReplies + 1,
    });

    return c.json({ reply }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /:id/like — Toggle like on a discussion thread (email verification required)
discussionRoutes.put('/:id/like', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const threadId = c.req.param('id');

    // Check if thread exists
    const thread = await getDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId);

    // Check if user already liked this thread (via a likes tracking document)
    const existingLikes = await listDocuments(c.env, APPWRITE_COLLECTIONS.DISCUSSION_LIKES, [
      Query.equal('threadId', threadId),
      Query.equal('userId', auth.userId!),
      Query.limit(1),
    ]);

    const currentLikes = ((thread as any).likes as number) || 0;

    if (existingLikes.documents.length > 0) {
      // Unlike: remove the like document and decrement count
      const likeDoc = existingLikes.documents[0] as Record<string, unknown> & { $id: string };
      await deleteDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSION_LIKES, likeDoc.$id);
      await updateDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId, {
        likes: Math.max(0, currentLikes - 1),
      });

      return c.json({ liked: false, likes: Math.max(0, currentLikes - 1) });
    } else {
      // Like: create a like document and increment count
      await createDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSION_LIKES, {
        threadId,
        userId: auth.userId,
      });
      await updateDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId, {
        likes: currentLikes + 1,
      });

      return c.json({ liked: true, likes: currentLikes + 1 });
    }
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /:id/pin — Pin/unpin a discussion thread (admin only)
discussionRoutes.put('/:id/pin', async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const threadId = c.req.param('id');

    // Check if user is admin
    const adminCheck = await isUserAdmin(c.env, auth.userId!);
    if (!adminCheck) {
      return c.json({ error: 'Only admins can pin discussions' }, 403);
    }

    // Get the thread
    const thread = await getDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId);
    const currentPinned = (thread as any).isPinned as boolean;

    await updateDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId, {
      isPinned: !currentPinned,
    });

    return c.json({
      isPinned: !currentPinned,
      message: !currentPinned ? 'Discussion pinned' : 'Discussion unpinned',
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// DELETE /:id — Delete a discussion thread (author or admin, email verification required)
discussionRoutes.delete('/:id', async (c) => {
  try {
    const authResult = await requireEmailVerified(c);
    if (authResult instanceof Response) return authResult;
    const auth = authResult;

    const threadId = c.req.param('id');

    // Get the thread to check ownership
    const thread = await getDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId);
    const threadUserId = (thread as any).userId as string;

    // Check if user is author or admin
    const adminCheck = await isUserAdmin(c.env, auth.userId!);
    if (threadUserId !== auth.userId && !adminCheck) {
      return c.json({ error: 'Only the author or admin can delete this discussion' }, 403);
    }

    // Delete all replies first
    const replies = await listDocuments(c.env, APPWRITE_COLLECTIONS.DISCUSSION_REPLIES, [
      Query.equal('threadId', threadId),
      Query.limit(500),
    ]);

    for (const reply of replies.documents) {
      const replyDoc = reply as Record<string, unknown> & { $id: string };
      await deleteDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSION_REPLIES, replyDoc.$id);
    }

    // Delete all likes for this thread
    const likes = await listDocuments(c.env, APPWRITE_COLLECTIONS.DISCUSSION_LIKES, [
      Query.equal('threadId', threadId),
      Query.limit(500),
    ]);

    for (const like of likes.documents) {
      const likeDoc = like as Record<string, unknown> & { $id: string };
      await deleteDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSION_LIKES, likeDoc.$id);
    }

    // Delete the thread itself
    await deleteDocument(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, threadId);

    return c.json({ success: true, message: 'Discussion deleted' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default discussionRoutes;
