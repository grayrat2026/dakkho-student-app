'use client';

import { useServerConfigStore } from '@/lib/store';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  // Subscribe to config directly so component re-renders when config changes
  const config = useServerConfigStore((s) => s.config);
  const isEnabled = config?.features ? (config.features[feature] ?? false) : true;

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
