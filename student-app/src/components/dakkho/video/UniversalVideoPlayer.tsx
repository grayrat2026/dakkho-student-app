'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// --- Types ---
export interface StreamData {
  type: 'youtube' | 'hls' | 'direct';
  url: string;
  title?: string;
  thumbnailUrl?: string;
}

export interface UniversalVideoPlayerProps {
  streamData: StreamData;
  onProgress?: (progress: { currentTime: number; duration: number; percent: number }) => void;
  onComplete?: () => void;
  initialTime?: number;
  autoplay?: boolean;
}

// --- Constants ---
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- YouTube IFrame API type ---
interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  destroy: () => void;
  getPlayerState: () => number;
}

interface YTEvent {
  data: number;
  target: YTPlayer;
}

// YouTube player states
const YT_PLAYING = 1;
const YT_ENDED = 0;
const YT_BUFFERING = 3;

// ============================================================
// Main Component
// ============================================================
export function UniversalVideoPlayer({
  streamData,
  onProgress,
  onComplete,
  initialTime = 0,
  autoplay = false,
}: UniversalVideoPlayerProps) {
  const { type, url } = streamData;

  // --- Shared player state ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Controls visibility ---
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  // ===========================================
  // Controls auto-hide
  // ===========================================
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [isPlaying]);

  // ===========================================
  // Progress callback (every 5 seconds)
  // ===========================================
  const fireProgress = useCallback(
    (ct: number, dur: number) => {
      if (onProgress && dur > 0) {
        const percent = Math.min((ct / dur) * 100, 100);
        onProgress({ currentTime: ct, duration: dur, percent });

        // Auto-complete at 90%
        if (percent >= 90 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
      }
    },
    [onProgress, onComplete],
  );

  // ===========================================
  // Fullscreen
  // ===========================================
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      // Try to lock landscape on mobile
      try {
        if (screen.orientation && (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock) {
          (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock('landscape').catch(() => {});
        }
      } catch {}
    } else {
      document.exitFullscreen().catch(() => {});
      try {
        const so = screen.orientation as unknown as { unlock: () => void };
        if (screen.orientation && so.unlock) {
          so.unlock();
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ===========================================
  // Player control functions
  // ===========================================
  const togglePlay = useCallback(() => {
    if (type === 'youtube') {
      const player = ytPlayerRef.current;
      if (!player) return;
      const state = player.getPlayerState();
      if (state === YT_PLAYING) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } else {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }, [type]);

  const seekRelative = useCallback(
    (delta: number) => {
      if (type === 'youtube') {
        const player = ytPlayerRef.current;
        if (!player) return;
        const newTime = Math.max(0, Math.min(player.getCurrentTime() + delta, player.getDuration()));
        player.seekTo(newTime, true);
        setCurrentTime(newTime);
      } else {
        const video = videoRef.current;
        if (!video) return;
        const newTime = Math.max(0, Math.min(video.currentTime + delta, video.duration || 0));
        video.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [type],
  );

  const seekTo = useCallback(
    (time: number) => {
      if (type === 'youtube') {
        const player = ytPlayerRef.current;
        if (!player) return;
        player.seekTo(time, true);
        setCurrentTime(time);
      } else {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = time;
        setCurrentTime(time);
      }
    },
    [type],
  );

  const adjustVolume = useCallback(
    (delta: number) => {
      const newVol = Math.max(0, Math.min(volume + delta, 100));
      setVolume(newVol);
      setIsMuted(newVol === 0);
      if (type === 'youtube') {
        const player = ytPlayerRef.current;
        if (!player) return;
        player.setVolume(newVol);
        if (newVol === 0) player.mute();
        else player.unMute();
      } else {
        const video = videoRef.current;
        if (video) {
          video.volume = newVol / 100;
          video.muted = newVol === 0;
        }
      }
    },
    [type, volume],
  );

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (type === 'youtube') {
      const player = ytPlayerRef.current;
      if (!player) return;
      if (newMuted) player.mute();
      else player.unMute();
    } else {
      const video = videoRef.current;
      if (video) video.muted = newMuted;
    }
  }, [type, isMuted]);

  const cycleSpeed = useCallback(
    (direction: 1 | -1) => {
      setPlaybackSpeed((prev) => {
        const idx = PLAYBACK_SPEEDS.indexOf(prev as typeof PLAYBACK_SPEEDS[number]);
        const newIdx = Math.max(0, Math.min(idx + direction, PLAYBACK_SPEEDS.length - 1));
        const newSpeed = PLAYBACK_SPEEDS[newIdx];

        if (type === 'youtube') {
          const player = ytPlayerRef.current;
          if (player) player.setPlaybackRate(newSpeed);
        } else {
          const video = videoRef.current;
          if (video) video.playbackRate = newSpeed;
        }

        return newSpeed;
      });
    },
    [type],
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      const dur = type === 'youtube' ? ytPlayerRef.current?.getDuration() || 0 : videoRef.current?.duration || 0;
      if (dur > 0) {
        seekTo(pct * dur);
      }
    },
    [type, seekTo],
  );

  const handleVolumeSlider = useCallback(
    (v: number) => {
      setVolume(v);
      setIsMuted(v === 0);
      if (type === 'youtube') {
        const player = ytPlayerRef.current;
        if (player) {
          player.setVolume(v);
          if (v === 0) player.mute();
          else player.unMute();
        }
      } else {
        const video = videoRef.current;
        if (video) {
          video.volume = v / 100;
          video.muted = v === 0;
        }
      }
    },
    [type],
  );

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    if (type === 'hls' && hlsRef.current) {
      hlsRef.current.loadSource(url);
      hlsRef.current.startLoad();
    } else if (type === 'direct' && videoRef.current) {
      videoRef.current.load();
    }
    // YouTube retry is handled by re-mounting the component
  }, [type, url]);

  // ===========================================
  // Keyboard shortcuts
  // ===========================================
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(10);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-10);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case '[':
          e.preventDefault();
          cycleSpeed(-1);
          break;
        case ']':
          e.preventDefault();
          cycleSpeed(1);
          break;
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [togglePlay, seekRelative, adjustVolume, toggleFullscreen, toggleMute, cycleSpeed]);

  // ===========================================
  // YouTube IFrame API initialization
  // ===========================================
  const initYouTubePlayer = useCallback(() => {
    if (!ytContainerRef.current) return;

    const extractVideoId = (ytUrl: string): string | null => {
      // Support various YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      ];
      for (const pattern of patterns) {
        const match = ytUrl.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Invalid YouTube URL');
      setIsLoading(false);
      return;
    }

    const createPlayer = () => {
      if (!ytContainerRef.current) return;

      // Destroy previous player if exists
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }

      // Clear container
      ytContainerRef.current.innerHTML = '';

      const playerDiv = document.createElement('div');
      playerDiv.id = `yt-player-${videoId}-${Date.now()}`;
      playerDiv.style.width = '100%';
      playerDiv.style.height = '100%';
      playerDiv.style.position = 'absolute';
      playerDiv.style.top = '0';
      playerDiv.style.left = '0';
      ytContainerRef.current.appendChild(playerDiv);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ytPlayerRef.current = new (window as any).YT.Player(playerDiv.id, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          start: Math.floor(initialTime),
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setIsLoading(false);
            const player = ytPlayerRef.current;
            if (player) {
              setDuration(player.getDuration());
              player.setVolume(volume);
              if (autoplay) {
                player.playVideo();
              }
            }
          },
          onStateChange: (event: YTEvent) => {
            const state = event.data;
            setIsPlaying(state === YT_PLAYING);
            setIsLoading(state === YT_BUFFERING);

            if (state === YT_PLAYING) {
              showControls();
            }

            if (state === YT_ENDED) {
              setIsPlaying(false);
              if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onComplete?.();
              }
            }
          },
          onError: () => {
            setError('Failed to load YouTube video. It may be private or unavailable.');
            setIsLoading(false);
          },
        },
      });
    };

    // Load YouTube IFrame API if not already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    }

    // Progress tracking for YouTube
    if (ytProgressRef.current) clearInterval(ytProgressRef.current);
    ytProgressRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && typeof player.getCurrentTime === 'function') {
        const ct = player.getCurrentTime();
        const dur = player.getDuration();
        setCurrentTime(ct);
        setDuration(dur);
      }
    }, 1000);

    // Progress callback every 5 seconds
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && typeof player.getCurrentTime === 'function') {
        const ct = player.getCurrentTime();
        const dur = player.getDuration();
        if (dur > 0 && player.getPlayerState() === YT_PLAYING) {
          fireProgress(ct, dur);
        }
      }
    }, 5000);

    return () => {
      if (ytProgressRef.current) clearInterval(ytProgressRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [url, autoplay, initialTime, volume, showControls, fireProgress, onComplete]);

  // ===========================================
  // YouTube initialization effect
  // ===========================================
  useEffect(() => {
    if (type !== 'youtube') return;
    const cleanup = initYouTubePlayer();
    return () => {
      cleanup?.();
    };
  }, [type, initYouTubePlayer]);

  // ===========================================
  // HLS initialization
  // ===========================================
  useEffect(() => {
    if (type !== 'hls') return;
    const video = videoRef.current;
    if (!video) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;

    const initHls = async () => {
      // Dynamic import of hls.js
      const Hls = (await import('hls.js')).default;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });
        hlsRef.current = hls;

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoplay) {
            video.play().catch(() => {});
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Network error. Check your connection and try again.');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Media error. Attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                setError('An error occurred while playing this video.');
                hls.destroy();
                break;
            }
            setIsLoading(false);
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          // Update buffered range
          if (video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1));
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          if (autoplay) {
            video.play().catch(() => {});
          }
        });
      } else {
        setError('HLS is not supported in this browser.');
        setIsLoading(false);
      }
    };

    initHls();

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [type, url, autoplay]);

  // ===========================================
  // Direct video (MP4/MKV/WebM) initialization
  // ===========================================
  useEffect(() => {
    if (type !== 'direct') return;
    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.load();

    if (initialTime > 0) {
      video.currentTime = initialTime;
    }

    if (autoplay) {
      video.play().catch(() => {});
    }
  }, [type, url, autoplay, initialTime]);

  // ===========================================
  // HTML5 video event handlers (HLS + Direct)
  // ===========================================
  useEffect(() => {
    if (type === 'youtube') return;
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      showControls();
    };
    const onPause = () => setIsPlaying(false);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete?.();
      }
    };
    const onError = () => {
      setError('Failed to load video. The file format may not be supported.');
      setIsLoading(false);
    };
    const onVolumeChange = () => {
      setVolume(Math.round(video.volume * 100));
      setIsMuted(video.muted);
    };
    const onRateChange = () => {
      setPlaybackSpeed(video.playbackRate);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ratechange', onRateChange);

    // Progress callback every 5 seconds for HTML5 video
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (video && !video.paused && video.duration > 0) {
        fireProgress(video.currentTime, video.duration);
      }
    }, 5000);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('ratechange', onRateChange);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [type, initialTime, showControls, fireProgress, onComplete]);

  // ===========================================
  // Sync playback speed to video element
  // ===========================================
  useEffect(() => {
    if (type === 'youtube') return;
    const video = videoRef.current;
    if (video && video.playbackRate !== playbackSpeed) {
      video.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, type]);

  // ===========================================
  // Derived values
  // ===========================================
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 50 ? Volume1 : Volume2;

  // ===========================================
  // Render
  // ===========================================
  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden"
      onMouseMove={showControls}
      onTouchStart={showControls}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-controls]')) {
          togglePlay();
        }
      }}
    >
      {/* Video element (HLS + Direct) */}
      {type !== 'youtube' && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
          style={{ backgroundColor: 'black' }}
        />
      )}

      {/* YouTube container */}
      {type === 'youtube' && (
        <div
          ref={ytContainerRef}
          className="absolute inset-0"
        />
      )}

      {/* Loading spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              <span className="text-white/80 text-xs font-semibold">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && !isLoading && (
          <motion.div
            data-controls
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-4 max-w-xs mx-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-white text-sm font-semibold">{error}</p>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl backdrop-blur-sm transition-colors"
                onClick={(e) => { e.stopPropagation(); handleRetry(); }}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play/pause overlay (when paused, no loading, no error) */}
      <AnimatePresence>
        {!isPlaying && !isLoading && !error && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            data-controls
            className="absolute bottom-0 left-0 right-0 z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Gradient backdrop */}
            <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-3 sm:px-4">
              {/* Progress bar */}
              <div className="relative w-full mb-3 group/progress">
                <div
                  className="w-full h-1.5 group-hover/progress:h-2.5 transition-all bg-white/20 rounded-full cursor-pointer relative"
                  onClick={handleProgressClick}
                >
                  {/* Buffered */}
                  <div
                    className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all"
                    style={{ width: `${bufferedPercent}%` }}
                  />
                  {/* Progress */}
                  <div
                    className="absolute top-0 left-0 h-full bg-sky-400 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* Scrubber dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-sky-400 rounded-full shadow-lg shadow-sky-400/50 opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-x-1/2"
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {/* Skip back */}
                  <button
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); seekRelative(-10); }}
                    title="Skip back 10s"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Play/Pause */}
                  <button
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" fill="currentColor" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                    )}
                  </button>

                  {/* Skip forward */}
                  <button
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); seekRelative(10); }}
                    title="Skip forward 10s"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-1 group/vol">
                    <button
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      <VolumeIcon className="w-4 h-4" />
                    </button>
                    <div className="hidden sm:flex items-center w-0 group-hover/vol:w-20 transition-all overflow-hidden">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={effectiveVolume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          handleVolumeSlider(v);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-1 accent-sky-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time display */}
                  <span className="text-xs font-mono ml-1">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Playback speed */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-white/10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="Playback speed"
                      >
                        {playbackSpeed}x
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/40 dark:border-white/10">
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            playbackSpeed === speed
                              ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaybackSpeed(speed);
                            if (type === 'youtube') {
                              ytPlayerRef.current?.setPlaybackRate(speed);
                            } else if (videoRef.current) {
                              videoRef.current.playbackRate = speed;
                            }
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  {/* Fullscreen */}
                  <button
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts hint */}
      <AnimatePresence>
        {controlsVisible && !isPlaying && !error && (
          <motion.div
            className="absolute top-3 right-3 z-20 text-white/40 text-[10px] hidden sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Space: Play/Pause | ←→: Seek | ↑↓: Vol | F: Fullscreen | M: Mute | [ ]: Speed
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
