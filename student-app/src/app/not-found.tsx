import { DakkhoApp } from '@/components/dakkho/DakkhoApp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DAKKHO — Student Streaming Platform',
  description: 'Bangladesh\'s premier polytechnic student streaming platform. Watch courses, learn from top instructors, and ace your diploma exams with DAKKHO.',
};

// This page becomes out/404.html during static export.
// Cloudflare Pages serves 404.html for any path that doesn't match a static asset.
// By rendering the full SPA here, a refresh on /explore, /settings, etc. will
// load the app, the client-side router (syncFromUrl) will pick up the URL path,
// and the correct page will render — even if the _redirects rule is bypassed
// by a Worker or some other deployment configuration issue.
export default function NotFound() {
  return <DakkhoApp />;
}
