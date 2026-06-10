// DAKKHO Admin Notifications Edge Function
// Replicates /api/admin/notifications route logic using Deno runtime

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
      const userId = url.searchParams.get('userId') || '';

      const queries: string[] = [
        Query.limit(limit),
        Query.offset((page - 1) * limit),
        Query.orderDesc('$createdAt'),
      ];
      if (userId) queries.push(Query.equal('userId', userId));

      const result = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.NOTIFICATIONS, queries);
      return jsonResponse({ documents: result.documents, total: result.total });
    }

    if (req.method === 'POST') {
      const data = await req.json();
      const { targetAll, targetUserId, targetInstitute, ...notificationData } = data;

      const created: unknown[] = [];

      if (targetAll) {
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const usersResult = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.USERS, [
            Query.limit(limit),
            Query.offset(offset),
          ]);

          for (const user of usersResult.documents) {
            const doc = await appwriteRest.createDocument(APPWRITE_COLLECTIONS.NOTIFICATIONS, '', {
              ...notificationData,
              userId: user.$id,
            });
            created.push(doc);
          }

          offset += limit;
          hasMore = usersResult.documents.length === limit;
        }
      } else if (targetInstitute) {
        const usersResult = await appwriteRest.listDocuments(APPWRITE_COLLECTIONS.USERS, [
          Query.equal('institute', targetInstitute),
          Query.limit(500),
        ]);

        for (const user of usersResult.documents) {
          const doc = await appwriteRest.createDocument(APPWRITE_COLLECTIONS.NOTIFICATIONS, '', {
            ...notificationData,
            userId: user.$id,
          });
          created.push(doc);
        }
      } else if (targetUserId) {
        const doc = await appwriteRest.createDocument(APPWRITE_COLLECTIONS.NOTIFICATIONS, '', {
          ...notificationData,
          userId: targetUserId,
        });
        created.push(doc);
      }

      await logAudit(adminId, 'SEND_NOTIFICATION', 'notifications', undefined, {
        targetAll,
        targetUserId,
        targetInstitute,
        count: created.length,
      });

      return jsonResponse({ created, count: created.length });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
