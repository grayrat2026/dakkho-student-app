// DAKKHO Admin System Status Edge Function
// Replicates /api/admin/system/status route logic using Deno runtime

import { corsHeaders, handleCors, jsonResponse } from '../_shared/cors.ts';
import { appwriteRest, getAppwriteConfig } from '../_shared/appwrite.ts';
import { checkR2Bucket, getR2Buckets } from '../_shared/r2.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ServiceStatus } from '../_shared/types.ts';

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

    const status: Record<string, unknown> = {};
    const { ENDPOINT, PROJECT_ID, API_KEY, DB_ID } = getAppwriteConfig();

    // --- Appwrite Health Check ---
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      };

      // Step 1: Try listing collections
      const dbRes = await fetch(
        `${ENDPOINT}/databases/${DB_ID}/collections`,
        { headers },
      );

      if (dbRes.ok) {
        const dbData = await dbRes.json().catch(() => ({}));
        const collectionCount = dbData?.total || 0;
        status.appwrite = {
          status: 'connected',
          message: `Database & auth working (${collectionCount} collections)`,
        } as ServiceStatus;
      } else {
        // Step 2: Try health endpoint
        const healthRes = await fetch(`${ENDPOINT}/health`, { headers });

        if (healthRes.ok) {
          status.appwrite = {
            status: 'limited',
            message: 'Server reachable but API key lacks database scopes',
          } as ServiceStatus;
        } else {
          status.appwrite = {
            status: 'error',
            message: 'API key unauthorized - missing scopes. Create a new key with: databases.read, databases.write, collections.read, collections.write, documents.read, documents.write, users.read, users.write, health.read',
          } as ServiceStatus;
        }
      }
    } catch {
      status.appwrite = { status: 'error', message: 'Server unreachable' } as ServiceStatus;
    }

    // --- R2 Bucket Checks ---
    status.r2 = {};
    const buckets = getR2Buckets();
    for (const [name, bucket] of Object.entries(buckets)) {
      try {
        const ok = await checkR2Bucket(bucket);
        (status.r2 as Record<string, ServiceStatus>)[name.toLowerCase()] = ok
          ? { status: 'connected', message: `Bucket "${bucket}" accessible` }
          : { status: 'error', message: `Bucket "${bucket}" not found or inaccessible` };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        (status.r2 as Record<string, ServiceStatus>)[name.toLowerCase()] = { status: 'error', message: msg };
      }
    }

    // --- Supabase Check ---
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error } = await supabase.auth.getSession();
      status.supabase = error
        ? { status: 'limited', message: error.message }
        : { status: 'connected', message: 'Edge functions & realtime working' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      status.supabase = { status: 'error', message: msg };
    }

    // --- MQTT Check ---
    // Note: MQTT requires persistent TCP connections which are not supported in
    // Supabase Edge Functions. We check if credentials are configured.
    const mqttBrokerUrl = Deno.env.get('MQTT_BROKER_URL');
    const mqttUsername = Deno.env.get('MQTT_USERNAME');
    const mqttPassword = Deno.env.get('MQTT_PASSWORD');
    if (!mqttBrokerUrl || !mqttUsername || !mqttPassword) {
      status.mqtt = { status: 'error', message: 'MQTT credentials not configured in environment' };
    } else {
      status.mqtt = { status: 'limited', message: 'MQTT credentials configured (cannot verify connection in Edge Functions)' };
    }

    return jsonResponse(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
