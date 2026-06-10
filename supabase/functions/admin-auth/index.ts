// DAKKHO Admin Auth - Login / Logout Edge Function
// Replicates /api/admin/auth route logic using Deno runtime

import { corsHeaders, handleCors, jsonResponse } from '../_shared/cors.ts';
import { appwriteAuth, getAppwriteConfig } from '../_shared/appwrite.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const { PROJECT_ID } = getAppwriteConfig();

    if (req.method === 'POST') {
      // --- LOGIN ---
      const { email, password } = await req.json();

      // Step 1: Create email session via Appwrite REST API
      const sessionRes = await appwriteAuth.createEmailSession(email, password);

      if (!sessionRes.ok) {
        const errData = await sessionRes.json();
        return jsonResponse(
          { error: errData.message || 'Invalid email or password' },
          401,
        );
      }

      // Step 2: Extract session cookie from response
      const setCookieHeaders = sessionRes.headers.getSetCookie?.() || [];
      let sessionCookie = '';

      for (const cookie of setCookieHeaders) {
        if (cookie.includes(`a_session_${PROJECT_ID}=`) && !cookie.includes('legacy')) {
          const match = cookie.match(new RegExp(`a_session_${PROJECT_ID}=([^;]+)`));
          if (match) {
            sessionCookie = match[1];
          }
        }
      }

      // Also check x-fallback-cookies header
      if (!sessionCookie) {
        const fallbackCookies = sessionRes.headers.get('x-fallback-cookies');
        if (fallbackCookies) {
          try {
            const parsed = JSON.parse(fallbackCookies);
            sessionCookie = parsed[`a_session_${PROJECT_ID}`] || '';
          } catch {
            // Ignore parse errors
          }
        }
      }

      if (!sessionCookie) {
        return jsonResponse({ error: 'Failed to establish session' }, 500);
      }

      // Step 3: Get account info using the session cookie
      const accountRes = await appwriteAuth.getAccount(sessionCookie);

      if (!accountRes.ok) {
        return jsonResponse({ error: 'Failed to get account info' }, 500);
      }

      const user = await accountRes.json();

      // Step 4: Check admin role from preferences
      const userPrefs = user.prefs || {};

      if (userPrefs?.role !== 'admin') {
        // Delete the Appwrite session
        await appwriteAuth.deleteSession(sessionCookie);
        return jsonResponse(
          { error: 'Access denied. Admin role required. Your account does not have admin privileges.' },
          403,
        );
      }

      // Step 5: Create admin session in Supabase (replaces Prisma AdminSession)
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from('admin_sessions').upsert(
        {
          user_id: user.$id,
          email: user.email,
          name: user.name,
          role: 'admin',
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'user_id' },
      );

      // Step 6: Delete the Appwrite session (we use our own cookie-based auth)
      await appwriteAuth.deleteSession(sessionCookie);

      // Step 7: Return success with session cookie
      const response = jsonResponse({
        success: true,
        user: { id: user.$id, email: user.email, name: user.name, role: 'admin' },
      });

      // Set admin session cookie via Set-Cookie header
      const headers = new Headers(response.headers);
      headers.append(
        'Set-Cookie',
        `dakkho-admin-session=${user.$id}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`,
      );

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    if (req.method === 'DELETE') {
      // --- LOGOUT ---
      const response = jsonResponse({ success: true });
      const headers = new Headers(response.headers);
      headers.append('Set-Cookie', 'dakkho-admin-session=; HttpOnly; Path=/; Max-Age=0');
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', error);
    return jsonResponse({ error: message }, 500);
  }
});
