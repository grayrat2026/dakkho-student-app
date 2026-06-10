'use client';

import { useCallback, useRef, useEffect } from 'react';

const DEFAULT_SOUND_URL = '/sounds/notification.mp3';

interface NotificationSoundOptions {
  /** Override sound URL (defaults to /sounds/notification.mp3) */
  soundUrl?: string;
  /** Volume 0-1 (default 0.7) */
  volume?: number;
  /** Whether sound is enabled (default true) */
  enabled?: boolean;
}

/**
 * Hook to play notification sounds.
 * Respects user settings and pre-loads the audio for instant playback.
 */
export function useNotificationSound(options: NotificationSoundOptions = {}) {
  const {
    soundUrl = DEFAULT_SOUND_URL,
    volume = 0.7,
    enabled = true,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);

  // Keep refs in sync with props
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Pre-load audio element once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(soundUrl);
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [soundUrl]);

  // Update volume on audio element when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSound = useCallback(() => {
    if (!enabledRef.current) return;
    if (!audioRef.current) {
      // Lazy-create if not yet initialized
      const audio = new Audio(soundUrl);
      audio.preload = 'auto';
      audio.volume = volumeRef.current;
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    // Reset to beginning and play
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be blocked by browser policy — silently ignore
        if (process.env.NODE_ENV === 'development') {
          console.warn('[NotificationSound] Play blocked:', err.message);
        }
      });
    }
  }, [soundUrl]);

  return { playSound };
}
