import { DakkhoApp } from '@/components/dakkho/DakkhoApp';

// Root page — renders the SPA shell.
// The client-side router (Zustand store) handles the actual page display.
export default function HomePage() {
  return <DakkhoApp />;
}
