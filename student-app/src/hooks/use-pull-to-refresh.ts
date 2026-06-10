'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
  /** Callback to invoke when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Pull distance threshold (in px) to trigger refresh. Default: 80 */
  threshold?: number;
  /** Maximum pull distance allowed. Default: 120 */
  maxPull?: number;
  /** Whether pull-to-refresh is enabled. Default: true (only works on touch devices) */
  enabled?: boolean;
}

interface UsePullToRefreshReturn {
  /** Whether the user is currently pulling down */
  isPulling: boolean;
  /** Current pull distance in pixels */
  pullDistance: number;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the pull has passed the threshold */
  isThresholdPassed: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isThresholdPassed, setIsThresholdPassed] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef(0);
  const currentPullRef = useRef(0);
  const isTouching = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Ref for onRefresh callback — updated via effect to satisfy React Compiler
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Ref for the spring back function — avoids self-referential useCallback
  const springBackRef = useRef<() => void>(() => {});

  // Update the spring back function via effect
  useEffect(() => {
    springBackRef.current = () => {
      const current = currentPullRef.current;
      if (current <= 0) {
        setPullDistance(0);
        setIsPulling(false);
        setIsThresholdPassed(false);
        currentPullRef.current = 0;
        return;
      }

      // Spring animation — ease out
      const decay = current * 0.15;
      const next = Math.max(0, current - Math.max(decay, 2));
      currentPullRef.current = next;
      setPullDistance(next);

      if (next > 0.5) {
        animationFrameRef.current = requestAnimationFrame(() => springBackRef.current());
      } else {
        setPullDistance(0);
        setIsPulling(false);
        setIsThresholdPassed(false);
        currentPullRef.current = 0;
      }
    };
  }, []);

  // Dampening function: resistance increases as you pull further
  const dampen = useCallback((distance: number) => {
    if (distance <= threshold) return distance;
    const overshoot = distance - threshold;
    return threshold + overshoot * 0.4;
  }, [threshold]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;
    const container = containerRef.current;
    if (!container) return;

    // Only activate when scrolled to the very top
    if (container.scrollTop > 0) return;

    touchStartY.current = e.touches[0].clientY;
    isTouching.current = true;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTouching.current || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only work when scrolled to top
    if (container.scrollTop > 0) {
      isTouching.current = false;
      setIsPulling(false);
      setPullDistance(0);
      currentPullRef.current = 0;
      return;
    }

    const touchY = e.touches[0].clientY;
    const rawDistance = touchY - touchStartY.current;

    // Only pull down (positive direction)
    if (rawDistance <= 0) {
      currentPullRef.current = 0;
      setPullDistance(0);
      setIsPulling(false);
      setIsThresholdPassed(false);
      return;
    }

    const dampened = dampen(Math.min(rawDistance, maxPull));
    currentPullRef.current = dampened;
    setPullDistance(dampened);
    setIsPulling(true);
    setIsThresholdPassed(dampened >= threshold);

    // Prevent native pull-to-refresh only when we're handling it
    if (rawDistance > 10) {
      e.preventDefault();
    }
  }, [isRefreshing, threshold, maxPull, dampen]);

  const handleTouchEnd = useCallback(() => {
    if (!isTouching.current) return;
    isTouching.current = false;

    const wasThresholdPassed = currentPullRef.current >= threshold;

    if (wasThresholdPassed && !isRefreshing) {
      setIsRefreshing(true);
      // Animate to threshold position while refreshing
      currentPullRef.current = threshold;
      setPullDistance(threshold);

      onRefreshRef.current()
        .catch(() => {
          // Refresh callback failed — ignore
        })
        .finally(() => {
          setIsRefreshing(false);
          // Spring back after refresh
          springBackRef.current();
        });
    } else {
      // Didn't reach threshold — spring back
      springBackRef.current();
    }
  }, [threshold, isRefreshing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    // Only add touch listeners (mobile only)
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    containerRef,
    isThresholdPassed,
  };
}
