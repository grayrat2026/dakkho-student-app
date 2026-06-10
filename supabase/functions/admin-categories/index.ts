// DAKKHO Admin Categories Edge Function
// Replicates /api/admin/categories route logic using Deno runtime

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
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const result = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.CATEGORIES, [
        Query.limit(limit),
        Query.orderAsc('sort_order'),
      ]);

      return jsonResponse({ documents: result.documents, total: result.total });
    }

    if (req.method === 'POST') {
      const data = await req.json();
      const result = await appwriteRest.createDocument(APPWRITE_COLLECTIONS.CATEGORIES, '', data);

      await logAudit(adminId, 'CREATE_CATEGORY', 'categories', result.$id, data);

      return jsonResponse({ document: result });
    }

    if (req.method === 'PUT') {
      const data = await req.json();
      const { categoryId, ...updates } = data;
      if (!categoryId) return jsonResponse({ error: 'Category ID required' }, 400);

      const result = await appwriteRest.updateDocument(APPWRITE_COLLECTIONS.CATEGORIES, categoryId, updates);
      await logAudit(adminId, 'UPDATE_CATEGORY', 'categories', categoryId, updates);

      return jsonResponse({ document: result });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const categoryId = url.searchParams.get('id');
      if (!categoryId) return jsonResponse({ error: 'Category ID required' }, 400);

      await appwriteRest.deleteDocument(APPWRITE_COLLECTIONS.CATEGORIES, categoryId);
      await logAudit(adminId, 'DELETE_CATEGORY', 'categories', categoryId);

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
