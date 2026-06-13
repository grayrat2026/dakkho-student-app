import { DakkhoApp } from '@/components/dakkho/DakkhoApp';

// This catch-all route ensures ALL paths render the SPA.
// The client-side router (Zustand store) handles the actual page display.
// Without this, refreshing on any non-root path returns 404 on Cloudflare Pages.

// Required for static export: pre-render common paths.
// All other routes are handled client-side by the SPA router on Cloudflare.
export async function generateStaticParams() {
  return [
    { slug: ['explore'] },
    { slug: ['courses'] },
    { slug: ['live-sessions'] },
    { slug: ['profile'] },
    { slug: ['settings'] },
    { slug: ['notifications'] },
    { slug: ['search'] },
    { slug: ['bookmarks'] },
    { slug: ['history'] },
    { slug: ['support'] },
  ];
}

export default function CatchAllPage({ params }: { params: { slug?: string[] } }) {
  return <DakkhoApp />;
}
