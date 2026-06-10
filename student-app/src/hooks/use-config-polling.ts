'use client';

import { useEffect } from 'react';
import { useServerConfigStore } from '@/lib/store';

/**
 * Polls the server config every 5 minutes.
 * Only re-fetches if the config_updated_at timestamp has changed,
 * avoiding unnecessary network traffic and state updates.
 *
 * Must be called inside a component rendered within the app tree.
 */
export function useConfigPolling() {
  const fetchConfig = useServerConfigStore((s) => s.fetchConfig);

  useEffect(() => {
    const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const interval = setInterval(() => {
      fetchConfig(); // Re-fetches; internally skips if configUpdatedAt unchanged
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchConfig]);
}
