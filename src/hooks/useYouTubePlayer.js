import { useEffect, useRef, useState, useCallback } from 'react';

let apiLoadingPromise = null;

function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR not supported'));

  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  if (apiLoadingPromise) {
    return apiLoadingPromise;
  }

  apiLoadingPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      console.log('[YouTube API] Injecting script tag for iframe_api');
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      console.log('[YouTube API] onYouTubeIframeAPIReady callback fired');
      if (typeof previousCallback === 'function') {
        previousCallback();
      }
      resolve(window.YT);
    };
  });

  return apiLoadingPromise;
}

const STATE_NAMES = {
  '-1': 'UNSTARTED',
  '0': 'ENDED',
  '1': 'PLAYING',
  '2': 'PAUSED',
  '3': 'BUFFERING',
  '5': 'CUED'
};

export function useYouTubePlayer({ youtubeId = '', playlistId = '', onSongEnd, onError: onErrorCallback } = {}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const pendingSongIdRef = useRef(null);
  const pendingPlaylistRef = useRef(null);
  const lastPlayedIdRef = useRef(null);
  const lastSkippedIndexRef = useRef(-1);
  const lastSkippedTimeRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [currentVideoId, setCurrentVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoAuthor, setVideoAuthor] = useState('');
  const [error, setError] = useState(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Helper to extract and update current video data
  const updateVideoData = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getVideoData === 'function') {
      try {
        const vData = playerRef.current.getVideoData() || {};
        const vId = vData.video_id || '';
        const vTitle = vData.title || '';
        const vAuthor = vData.author || '';

        if (vId && vId !== currentVideoId) {
          setCurrentVideoId(vId);
        }
        if (vTitle && vTitle !== videoTitle) {
          setVideoTitle(vTitle);
        }
        if (vAuthor && vAuthor !== videoAuthor) {
          setVideoAuthor(vAuthor);
        }
      } catch {
        // Ignore transient video_data access errors
      }
    }
  }, [currentVideoId, videoTitle, videoAuthor]);

  // Poll current playback time, duration, and current video data while playing
  useEffect(() => {
    let timer = null;
    if (isPlaying && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      timer = setInterval(() => {
        try {
          const curr = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(curr);
          setDuration(dur);
          updateVideoData();
        } catch {
          // Ignore transient playback access errors
        }
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, updateVideoData]);

  const onSongEndRef = useRef(onSongEnd);
  const onErrorCallbackRef = useRef(onErrorCallback);

  useEffect(() => {
    onSongEndRef.current = onSongEnd;
    onErrorCallbackRef.current = onErrorCallback;
  }, [onSongEnd, onErrorCallback]);

  // Initialize YouTube Player Instance
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    loadYouTubeIframeApi().then((YT) => {
      if (!isMounted || !containerRef.current) return;

      if (playerRef.current) return;

      const elementId = `yt-player-element-${Math.random().toString(36).substring(2, 9)}`;
      const playerDiv = document.createElement('div');
      playerDiv.id = elementId;
      containerRef.current.appendChild(playerDiv);

      console.log('[YouTube Player] Creating YT.Player instance on elementId:', elementId, 'initial youtubeId:', youtubeId, 'playlistId:', playlistId);

      playerRef.current = new YT.Player(elementId, {
        height: '100%',
        width: '100%',
        videoId: youtubeId || 'Ax5jPATJM1A',
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            if (!isMounted) return;
            console.log('[YouTube Player] onReady event fired. Duration:', event.target.getDuration());
            setIsReady(true);
            try {
              setDuration(event.target.getDuration() || 0);
              setVolumeState(event.target.getVolume() || 100);
              const vId = event.target.getVideoData()?.video_id || '';
              if (vId) setCurrentVideoId(vId);
            } catch (err) {
              console.warn('[YouTube Player] Error reading onReady metadata:', err);
            }

            // Execute queued pending playlist or song playback onReady
            if (pendingPlaylistRef.current) {
              const { playlistId: targetPlId, index: targetIdx } = pendingPlaylistRef.current;
              pendingPlaylistRef.current = null;
              lastPlayedIdRef.current = targetPlId;
              console.log('[YouTube Player] Executing pending playlist playback onReady for:', targetPlId);
              try {
                event.target.loadPlaylist({ listType: 'playlist', list: targetPlId, index: targetIdx });
              } catch (err) {
                console.error('[YouTube Player] Error loading pending playlist onReady:', err);
              }
            } else if (pendingSongIdRef.current) {
              const pendingId = pendingSongIdRef.current;
              console.log('[YouTube Player] Executing pending song playback onReady for:', pendingId);
              pendingSongIdRef.current = null;
              lastPlayedIdRef.current = pendingId;
              try {
                event.target.loadVideoById(pendingId);
              } catch (err) {
                console.error('[YouTube Player] Error playing pending song onReady:', err);
              }
            }
          },
          onStateChange: (event) => {
            if (!isMounted) return;
            const state = event.data;
            console.log(`[YouTube Player] onStateChange: ${state} (${STATE_NAMES[state] || 'UNKNOWN'})`);

            try {
              const vId = event.target.getVideoData()?.video_id || '';
              if (vId) setCurrentVideoId(vId);
            } catch {
              // Ignore video_id read error on state change
            }

            if (state === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsPaused(false);
              setIsEnded(false);
              setAutoplayBlocked(false);
            } else if (state === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsPaused(true);
            } else if (state === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setIsPaused(false);
              setIsEnded(true);
              if (typeof onSongEndRef.current === 'function') {
                onSongEndRef.current();
              }
            }
          },
          onError: (event) => {
            if (!isMounted) return;
            const errCode = event.data;
            console.error(`[YouTube Player] onError fired with error code: ${errCode}`);

            // Handle embedding errors 101 or 150 in playlist mode
            if (playlistId && (errCode === 101 || errCode === 150)) {
              try {
                const pIndex = playerRef.current?.getPlaylistIndex?.() ?? -1;
                const playlist = playerRef.current?.getPlaylist?.() || [];
                const playlistLength = playlist.length;
                const now = Date.now();

                console.warn(`[YouTube Player] Embedding blocked (error ${errCode}) at playlist index ${pIndex}`);

                // Guard against duplicate skip calls for the same index within 2 seconds
                if (lastSkippedIndexRef.current === pIndex && (now - lastSkippedTimeRef.current < 2000)) {
                  console.warn(`[YouTube Player] Skip loop protection active: already skipped index ${pIndex}`);
                } else {
                  lastSkippedIndexRef.current = pIndex;
                  lastSkippedTimeRef.current = now;

                  // End of playlist guard
                  if (playlistLength > 0 && pIndex >= playlistLength - 1) {
                    console.warn(`[YouTube Player] Blocked track is final playlist item (index ${pIndex} of ${playlistLength}). Halting auto-advance.`);
                  } else {
                    console.log(`[YouTube Player] Auto-skipping non-embeddable track at index ${pIndex} -> calling nextVideo()`);
                    playerRef.current?.nextVideo?.();
                  }
                }
              } catch (skipErr) {
                console.error('[YouTube Player] Error during auto-skip handling:', skipErr);
              }
            }

            const errObj = { code: errCode, message: `YouTube Player error code: ${errCode}` };
            setError(errObj);
            if (typeof onErrorCallbackRef.current === 'function') {
              onErrorCallbackRef.current(errObj);
            }
          }
        }
      });
    });

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        console.log('[YouTube Player] Destroying player instance');
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, []);

  // Update video when youtubeId prop changes
  useEffect(() => {
    if (!isReady || !playerRef.current || playlistId) return;
    console.log('[YouTube Player] youtubeId prop updated to:', youtubeId, 'lastPlayedId:', lastPlayedIdRef.current);

    // Avoid overriding active loadVideoById call with cueVideoById
    if (youtubeId && lastPlayedIdRef.current === youtubeId) {
      console.log('[YouTube Player] youtubeId matches lastPlayedId, skipping cueVideoById override');
      return;
    }

    if (youtubeId) {
      try {
        if (isPlaying) {
          console.log('[YouTube Player] Player currently playing, calling loadVideoById for:', youtubeId);
          playerRef.current.loadVideoById(youtubeId);
          lastPlayedIdRef.current = youtubeId;
        } else {
          console.log('[YouTube Player] Player currently stopped/paused, calling cueVideoById for:', youtubeId);
          playerRef.current.cueVideoById(youtubeId);
        }
        setIsEnded(false);
        setError(null);
      } catch (err) {
        console.warn('[YouTube Player] Error during cue/loadVideoById:', err);
      }
    } else {
      try {
        if (typeof playerRef.current.stopVideo === 'function') {
          playerRef.current.stopVideo();
        }
      } catch {
        // Ignore stop failure
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [youtubeId, playlistId, isReady, isPlaying]);

  // Update playlist when playlistId prop changes
  useEffect(() => {
    if (!isReady || !playerRef.current || !playlistId) return;
    console.log('[YouTube Player] playlistId prop updated to:', playlistId, 'lastPlayedId:', lastPlayedIdRef.current);
    if (lastPlayedIdRef.current === playlistId) return;

    try {
      if (isPlaying) {
        playerRef.current.loadPlaylist({ listType: 'playlist', list: playlistId, index: 0 });
      } else {
        playerRef.current.cuePlaylist({ listType: 'playlist', list: playlistId, index: 0 });
      }
      lastPlayedIdRef.current = playlistId;
      setIsEnded(false);
      setError(null);
    } catch (err) {
      console.warn('[YouTube Player] Error during playlist cue/load:', err);
    }
  }, [playlistId, isReady, isPlaying]);

  // Playback Control API
  const playSongId = useCallback((idToPlay) => {
    const targetId = idToPlay || youtubeId;
    console.log('[YouTube Player] playSongId requested for ID:', targetId);
    if (!targetId) return;

    lastPlayedIdRef.current = targetId;

    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        console.log('[YouTube Player] Executing playerRef.current.loadVideoById for targetId:', targetId);
        playerRef.current.loadVideoById(targetId);
        pendingSongIdRef.current = null;
        setIsEnded(false);
        setError(null);
      } catch (err) {
        console.error('[YouTube Player] Exception during loadVideoById:', err);
        setAutoplayBlocked(true);
      }
    } else {
      console.log('[YouTube Player] Player not fully ready yet, queueing pending targetId:', targetId);
      pendingSongIdRef.current = targetId;
    }
  }, [youtubeId]);

  const playPlaylistId = useCallback((playlistIdToPlay, index = 0) => {
    const targetPlaylistId = playlistIdToPlay || playlistId;
    console.log('[YouTube Player] playPlaylistId requested for ID:', targetPlaylistId);
    if (!targetPlaylistId) return;

    lastPlayedIdRef.current = targetPlaylistId;

    if (playerRef.current && typeof playerRef.current.loadPlaylist === 'function') {
      try {
        console.log('[YouTube Player] Executing playerRef.current.loadPlaylist for targetPlaylistId:', targetPlaylistId);
        playerRef.current.loadPlaylist({
          listType: 'playlist',
          list: targetPlaylistId,
          index
        });
        pendingPlaylistRef.current = null;
        setIsEnded(false);
        setError(null);
      } catch (err) {
        console.error('[YouTube Player] Exception during loadPlaylist:', err);
        setAutoplayBlocked(true);
      }
    } else {
      console.log('[YouTube Player] Player not fully ready yet, queueing pending playlist targetId:', targetPlaylistId);
      pendingPlaylistRef.current = { playlistId: targetPlaylistId, index };
    }
  }, [playlistId]);

  const nextVideo = useCallback(() => {
    if (!playerRef.current || typeof playerRef.current.nextVideo !== 'function') return;
    try {
      console.log('[YouTube Player] Calling playerRef.current.nextVideo()');
      playerRef.current.nextVideo();
    } catch (err) {
      console.error('[YouTube Player] Exception during nextVideo():', err);
    }
  }, []);

  const previousVideo = useCallback(() => {
    if (!playerRef.current || typeof playerRef.current.previousVideo !== 'function') return;
    try {
      console.log('[YouTube Player] Calling playerRef.current.previousVideo()');
      playerRef.current.previousVideo();
    } catch (err) {
      console.error('[YouTube Player] Exception during previousVideo():', err);
    }
  }, []);

  const play = useCallback(() => {
    if (playlistId) {
      playPlaylistId(playlistId);
    } else {
      playSongId(youtubeId);
    }
  }, [playlistId, youtubeId, playPlaylistId, playSongId]);

  const pause = useCallback(() => {
    if (!playerRef.current) return;
    try {
      console.log('[YouTube Player] Invoking pauseVideo');
      playerRef.current.pauseVideo();
    } catch (err) {
      console.error('[YouTube Player] Exception during pauseVideo:', err);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((seconds) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    } catch {
      // Ignore seek error
    }
  }, []);

  const setVolume = useCallback((vol) => {
    if (!playerRef.current) return;
    try {
      const clamped = Math.max(0, Math.min(100, vol));
      playerRef.current.setVolume(clamped);
      setVolumeState(clamped);
    } catch {
      // Ignore volume error
    }
  }, []);

  return {
    containerRef,
    isReady,
    isPlaying,
    isPaused,
    isEnded,
    currentTime,
    duration,
    volume,
    currentVideoId,
    videoTitle,
    videoAuthor,
    error,
    autoplayBlocked,
    play,
    playSongId,
    playPlaylistId,
    nextVideo,
    previousVideo,
    pause,
    togglePlay,
    seekTo,
    setVolume
  };
}
