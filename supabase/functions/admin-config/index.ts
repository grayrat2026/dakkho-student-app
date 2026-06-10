// DAKKHO Admin Config Edge Function
// Replicates /api/admin/config route logic using Deno runtime
// Uses Supabase table (app_config) instead of Prisma/SQLite

import { corsHeaders, handleCors, jsonResponse, getAdminSessionId } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const DEFAULT_CONFIG = {
  featureToggles: {
    downloads: true,
    bookmarks: true,
    certificates: true,
    liveSessions: true,
    achievements: true,
    assignments: true,
    discussions: true,
    community: true,
    leaderboard: true,
    studyGroups: true,
    peerConnections: true,
    feedback: true,
    pricing: true,
    referral: true,
  },
  homePageSections: {
    sections: ['hero', 'continue-watching', 'categories', 'new-releases', 'live', 'trending', 'instructors', 'leaderboard', 'recommended'],
  },
  sidebarVisibility: {
    menu: true,
    departments: true,
    semesters: true,
    exams: true,
    community: true,
    general: true,
  },
  bottomNavTabs: {
    tabs: [
      { id: 'home', label: 'Home', enabled: true, order: 0 },
      { id: 'explore', label: 'Explore', enabled: true, order: 1 },
      { id: 'my-courses', label: 'My Courses', enabled: true, order: 2 },
      { id: 'watch-history', label: 'Watch History', enabled: true, order: 3 },
      { id: 'profile', label: 'Profile', enabled: true, order: 4 },
    ],
  },
  topBarElements: {
    search: true,
    notifications: true,
    avatar: true,
    hamburger: true,
  },
  cardStyle: 'glass',
  contentProtection: {
    enabled: true,
    noCopy: true,
    noRightClick: true,
    noScreenshot: true,
    noPrint: true,
    customContextMenu: true,
    watermark: false,
    dragProtection: true,
  },
};

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
      const { data: configs, error } = await supabase
        .from('app_config')
        .select('*');

      if (error) throw error;

      const configMap: Record<string, unknown> = {};
      for (const c of configs || []) {
        configMap[c.key] = JSON.parse(c.value);
      }

      const config = {
        featureToggles: { ...DEFAULT_CONFIG.featureToggles, ...(configMap.featureToggles as Record<string, unknown> || {}) },
        homePageSections: (configMap.homePageSections as typeof DEFAULT_CONFIG.homePageSections) || DEFAULT_CONFIG.homePageSections,
        sidebarVisibility: { ...DEFAULT_CONFIG.sidebarVisibility, ...(configMap.sidebarVisibility as Record<string, unknown> || {}) },
        bottomNavTabs: (configMap.bottomNavTabs as typeof DEFAULT_CONFIG.bottomNavTabs) || DEFAULT_CONFIG.bottomNavTabs,
        topBarElements: { ...DEFAULT_CONFIG.topBarElements, ...(configMap.topBarElements as Record<string, unknown> || {}) },
        cardStyle: (configMap.cardStyle as string) || DEFAULT_CONFIG.cardStyle,
        contentProtection: { ...DEFAULT_CONFIG.contentProtection, ...(configMap.contentProtection as Record<string, unknown> || {}) },
      };

      return jsonResponse(config);
    }

    if (req.method === 'PUT') {
      const config = await req.json();

      const sections: Record<string, unknown> = {
        featureToggles: config.featureToggles,
        homePageSections: config.homePageSections,
        sidebarVisibility: config.sidebarVisibility,
        bottomNavTabs: config.bottomNavTabs,
        topBarElements: config.topBarElements,
        cardStyle: config.cardStyle,
        contentProtection: config.contentProtection,
      };

      for (const [key, value] of Object.entries(sections)) {
        const { error } = await supabase
          .from('app_config')
          .upsert(
            { key, value: JSON.stringify(value) },
            { onConflict: 'key' },
          );
        if (error) console.error(`Failed to upsert config key "${key}":`, error);
      }

      // Note: MQTT broadcast is not supported in Edge Functions.
      // Config updates will be picked up on next client fetch.
      console.log('Config updated. MQTT broadcast not available in Edge Functions.');

      await logAudit(adminId, 'UPDATE_CONFIG', 'config', undefined, config);

      return jsonResponse({ success: true, config });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
