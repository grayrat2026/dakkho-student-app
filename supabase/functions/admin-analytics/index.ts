// DAKKHO Admin Analytics Edge Function
// Replicates /api/admin/analytics route logic using Deno runtime

import { corsHeaders, handleCors, jsonResponse } from '../_shared/cors.ts';
import { appwriteRest, Query } from '../_shared/appwrite.ts';
import { APPWRITE_COLLECTIONS } from '../_shared/types.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const [usersRes, coursesRes, videosRes, enrollmentsRes] = await Promise.all([
      appwriteRest.listDocuments(APPWRITE_COLLECTIONS.USERS, [Query.limit(1)]),
      appwriteRest.listDocuments(APPWRITE_COLLECTIONS.COURSES, [Query.limit(1)]),
      appwriteRest.listDocuments(APPWRITE_COLLECTIONS.VIDEOS, [Query.limit(1)]),
      appwriteRest.listDocuments(APPWRITE_COLLECTIONS.ENROLLMENTS, [Query.limit(1)]),
    ]);

    const stats = {
      totalUsers: usersRes.total,
      totalCourses: coursesRes.total,
      totalVideos: videosRes.total,
      totalEnrollments: enrollmentsRes.total,
      activeSessions: 0,
      newSignupsToday: 0,
    };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recentUsers = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.USERS, [
        Query.greaterThanEqual('$createdAt', today.toISOString()),
        Query.limit(1),
      ]);
      stats.newSignupsToday = recentUsers.total;
    } catch {
      // Ignore errors for today's signups query
    }

    const recentEnrollments = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.ENROLLMENTS, [
      Query.limit(10),
      Query.orderDesc('$createdAt'),
    ]);

    const popularCourses = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.COURSES, [
      Query.limit(5),
      Query.orderDesc('totalStudents'),
    ]);

    return jsonResponse({
      stats,
      recentEnrollments: recentEnrollments.documents,
      popularCourses: popularCourses.documents,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
