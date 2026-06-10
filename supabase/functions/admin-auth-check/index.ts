// DAKKHO Admin Auth Check Edge Function
// Replicates /api/admin/auth/check route logic using Deno runtime

import { corsHeaders, handleCors, jsonResponse, getAdminSessionId } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const sessionId = getAdminSessionId(req);

    if (!sessionId) {
      return jsonResponse({ authenticated: false }, 401);
    }

    // Query admin_sessions table in Supabase (replaces Prisma AdminSession)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('user_id', sessionId)
      .single();

    if (error || !session || new Date(session.expires_at) < new Date()) {
      return jsonResponse({ authenticated: false }, 401);
    }

    return jsonResponse({
      authenticated: true,
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch {
    return jsonResponse({ authenticated: false }, 401);
  }
});
