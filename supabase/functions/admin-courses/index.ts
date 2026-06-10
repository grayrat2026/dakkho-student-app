// DAKKHO Admin Courses Edge Function
// Replicates /api/admin/courses route logic using Deno runtime

import { corsHeaders, handleCors, jsonResponse, getAdminSessionId } from '../_shared/cors.ts';
import { appwriteRest, Query } from '../_shared/appwrite.ts';
import { APPWRITE_COLLECTIONS } from '../_shared/types.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function logAudit(
  adminId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: unknown,
) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('audit_logs').insert({
      admin_id: adminId,
      action,
      resource,
      resource_id: resourceId || null,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const adminId = getAdminSessionId(req) || 'unknown';

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search') || '';
      const level = url.searchParams.get('level') || '';
      const published = url.searchParams.get('published') || '';
      const featured = url.searchParams.get('featured') || '';

      const queries: string[] = [];
      if (search) queries.push(Query.search('title', search));
      if (level) queries.push(Query.equal('level', level));
      if (published === 'true') queries.push(Query.equal('isPublished', true));
      if (published === 'false') queries.push(Query.equal('isPublished', false));
      if (featured === 'true') queries.push(Query.equal('isFeatured', true));

      queries.push(Query.limit(limit));
      queries.push(Query.offset((page - 1) * limit));
      queries.push(Query.orderDesc('$createdAt'));

      const result = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.COURSES, queries);
      return jsonResponse({ documents: result.documents, total: result.total });
    }

    if (req.method === 'POST') {
      const data = await req.json();
      const result = await appwriteRest.createDocument(APPWRITE_COLLECTIONS.COURSES, '', data);

      await logAudit(adminId, 'CREATE_COURSE', 'courses', result.$id, data);

      return jsonResponse({ document: result });
    }

    if (req.method === 'PUT') {
      const data = await req.json();
      const { courseId, ...updates } = data;

      if (!courseId) return jsonResponse({ error: 'Course ID required' }, 400);

      const result = await appwriteRest.updateDocument(APPWRITE_COLLECTIONS.COURSES, courseId, updates);
      await logAudit(adminId, 'UPDATE_COURSE', 'courses', courseId, updates);

      return jsonResponse({ document: result });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const courseId = url.searchParams.get('id');

      if (!courseId) return jsonResponse({ error: 'Course ID required' }, 400);

      await appwriteRest.deleteDocument(APPWRITE_COLLECTIONS.COURSES, courseId);
      await logAudit(adminId, 'DELETE_COURSE', 'courses', courseId);

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
