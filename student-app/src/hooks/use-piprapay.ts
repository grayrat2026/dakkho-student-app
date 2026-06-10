'use client';
import { useState } from 'react';
import { paymentApi } from '../lib/api-client';

export function usePipraPay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (packageId: number, couponCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentApi.create({ packageId, couponCode });
      // Redirect to PipraPay checkout
      window.location.href = result.pp_url;
    } catch (err: any) {
      setError(err?.message || 'Payment creation failed');
      setLoading(false);
    }
  };

  return { handleBuy, loading, error };
}
