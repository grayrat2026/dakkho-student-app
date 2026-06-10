// DAKKHO Admin Upload Edge Function
// Replicates /api/admin/upload route logic using Deno runtime

import { corsHeaders, handleCors, jsonResponse, getAdminSessionId } from '../_shared/cors.ts';
import { uploadToR2, deleteFromR2, getR2PublicUrl } from '../_shared/r2.ts';
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

    if (req.method === 'POST') {
      // Parse multipart form data
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const bucket = formData.get('bucket') as string | null;
      const prefix = (formData.get('prefix') as string) || '';

      if (!file || !bucket) {
        return jsonResponse({ error: 'File and bucket are required' }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const body = new Uint8Array(arrayBuffer);
      const key = prefix ? `${prefix}/${Date.now()}-${file.name}` : `${Date.now()}-${file.name}`;

      await uploadToR2(bucket, key, body, file.type);

      const url = getR2PublicUrl(bucket, key);

      await logAudit(adminId, 'UPLOAD_FILE', 'r2', key, {
        bucket,
        fileName: file.name,
        size: file.size,
      });

      return jsonResponse({ url, key, bucket });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const bucket = url.searchParams.get('bucket');
      const key = url.searchParams.get('key');

      if (!bucket || !key) {
        return jsonResponse({ error: 'Bucket and key are required' }, 400);
      }

      await deleteFromR2(bucket, key);

      await logAudit(adminId, 'DELETE_FILE', 'r2', key, { bucket });

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
