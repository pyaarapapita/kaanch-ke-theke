import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MusicPlayer = React.memo(function MusicPlayer({
  hasEntered = false,
  isScrolled = false,
  currentSong,
  isPlaying,
  currentTime = 0,
  duration = 0,
  volume = 100,
  togglePlay,
  seekTo,
  setVolume,
  onNext,
  onPrevious,
  playbackError = null,
  isReady = true,
  isLoadingMetadata = false,
  autoSkipMessage = null,
  onRetry = null
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(100);
  const [isExpandedOnScroll, setIsExpandedOnScroll] = useState(false);

  // Close the expanded corner player when user scrolls back to top
  useEffect(() => {
    if (!isScrolled) {
      setIsExpandedOnScroll(false);
    }
  }, [isScrolled]);

  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (seekTo) seekTo(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    if (setVolume) setVolume(newVol);
    if (newVol > 0) setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      if (setVolume) setVolume(prevVolume || 80);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      if (setVolume) setVolume(0);
      setIsMuted(true);
    }
  };

  const songTitle = currentSong?.title || 'काँच के ठेके';
  const songArtist = currentSong?.artist || 'आज कुछ पुराना सुनते हैं';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const currentMins = Math.floor(currentTime / 60);
  const currentSecs = Math.floor(currentTime % 60);
  const timeValueText = currentMins > 0 ? `${currentMins} मिनट ${currentSecs} सेकंड` : `${currentSecs} सेकंड`;
  const volumeValueText = `${isMuted ? 0 : volume} प्रतिशत`;

  // Animation variants: Center bottom when at top; swoop and disappear in corner when scrolled
  const wrapperVariants = {
    hidden: {
      x: '-50%',
      y: 80,
      opacity: 0,
      scale: 0.96,
      pointerEvents: 'none',
      transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] }
    },
    visible: {
      x: '-50%',
      y: 0,
      opacity: 1,
      scale: 1,
      pointerEvents: 'auto',
      transition: { type: 'spring', damping: 25, stiffness: 220, mass: 0.85 }
    },
    disappearedInCorner: {
      x: 'calc(50vw - 3.5rem)',
      y: 48,
      opacity: 0,
      scale: 0.25,
      pointerEvents: 'none',
      transition: { duration: 0.38, ease: [0.32, 0.72, 0, 1] }
    }
  };

  const currentAnimation = !hasEntered
    ? 'hidden'
    : isScrolled
    ? 'disappearedInCorner'
    : 'visible';

  return (
    <>
      {/* Main Center Floating Music Player (disappears into corner on scroll) */}
      <motion.div
        className="cinematic-player-wrapper"
        initial={false}
        animate={currentAnimation}
        variants={wrapperVariants}
      >
        <div
          className="cinematic-player"
          style={{ '--player-progress': `${progressPercent}%` }}
        >
          {/* Left: Artwork / Vinyl Record Badge & Track Details */}
          <div className="player-meta-group">
            <div
              className="player-artwork"
              title={isPlaying ? 'संगीत चालू है (Vinyl Spinning)' : 'संगीत रुका हुआ है (Vinyl Paused)'}
            >
              <svg
                className={`vinyl-record ${isPlaying ? 'playing' : ''}`}
                viewBox="0 0 100 100"
                width="38"
                height="38"
                aria-hidden="true"
              >
                <circle cx="50" cy="50" r="48" fill="#120F0C" stroke="var(--accent-gold)" strokeWidth="1.2" strokeOpacity="0.7" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#26201A" strokeWidth="1" opacity="0.85" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#1A1511" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="31" fill="none" stroke="#2E251E" strokeWidth="0.8" opacity="0.9" />
                <circle cx="50" cy="50" r="26" fill="none" stroke="#1D1814" strokeWidth="1" />
                <circle cx="50" cy="50" r="21" fill="none" stroke="#332921" strokeWidth="0.8" opacity="0.7" />
                <path d="M 16 16 L 84 84" stroke="rgba(232, 215, 181, 0.09)" strokeWidth="14" strokeLinecap="round" />
                <circle cx="50" cy="50" r="15" fill="url(#vinylLabelGrad)" stroke="var(--accent-red)" strokeWidth="1" />
                <circle cx="50" cy="50" r="4" fill="#0B0A08" stroke="var(--accent-gold)" strokeWidth="0.8" />
                <defs>
                  <radialGradient id="vinylLabelGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#D4A35F" />
                    <stop offset="65%" stopColor="var(--accent-gold)" />
                    <stop offset="100%" stopColor="var(--accent-red)" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            <div className="player-track-info" aria-live="polite" aria-atomic="true">
              {!isReady && (
                <span className="player-loading-state" aria-live="polite">
                  बोतल खोली जा रही है...
                </span>
              )}
              {isLoadingMetadata && !playbackError && (
                <span className="player-loading-state" aria-live="polite">
                  नई बोतल की जानकारी आ रही है...
                </span>
              )}
              {(isReady && !isLoadingMetadata) || playbackError ? (
                <>
                  <span className="player-song-title" title={songTitle}>
                    {songTitle}
                  </span>
                  <span className="player-song-artist" title={songArtist}>
                    {songArtist}
                  </span>
                </>
              ) : null}
              {playbackError && onRetry && (
                <button
                  type="button"
                  className="player-error-tag player-retry-btn"
                  onClick={onRetry}
                  aria-label="पुनः प्रयास करें"
                >
                  पुनः प्रयास करें
                </button>
              )}
              {playbackError && !onRetry && (
                <span className="player-error-tag" title="गाना चलाने में समस्या आई">
                  पुनः प्रयास करें
                </span>
              )}
            </div>
          </div>

          {autoSkipMessage && (
            <div className="player-auto-skip-message" aria-live="polite" role="status">
              {autoSkipMessage}
            </div>
          )}

          {/* Center Section: Playback Controls & Progress Bar */}
          <div className="player-center-controls">
            <div className="player-buttons">
              <button
                type="button"
                className="player-btn prev-btn"
                onClick={onPrevious}
                aria-label="पिछला गाना (Previous)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                type="button"
                className="player-btn play-pause-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? 'रोकें (Pause)' : 'चलाएं (Play)'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className="player-btn next-btn"
                onClick={onNext}
                aria-label="अगला गाना (Next)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            {/* Timeline / Progress Bar */}
            <div className="player-timeline">
              <span className="time-display">{formatTime(currentTime)}</span>
              <div className="slider-container">
                <input
                  type="range"
                  className="progress-slider"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime || 0}
                  onChange={handleSeekChange}
                  aria-label="गीत की प्रगति (Playback Progress)"
                  aria-valuetext={timeValueText}
                  style={{
                    background: `linear-gradient(to right, var(--accent-gold) 0%, var(--accent-gold) ${progressPercent}%, rgba(232, 215, 181, 0.2) ${progressPercent}%, rgba(232, 215, 181, 0.2) 100%)`
                  }}
                />
              </div>
              <span className="time-display">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Section: Volume Control */}
          <div className="player-volume-control">
            <button
              type="button"
              className="player-btn volume-btn"
              onClick={handleToggleMute}
              aria-label={isMuted || volume === 0 ? 'आवाज़ खोलें (Unmute)' : 'आवाज़ बंद करें (Mute)'}
            >
              {isMuted || volume === 0 ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              className="volume-slider"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="आवाज़ का स्तर (Volume Level)"
              aria-valuetext={volumeValueText}
              style={{
                background: `linear-gradient(to right, var(--accent-gold) 0%, var(--accent-gold) ${isMuted ? 0 : volume}%, rgba(232, 215, 181, 0.2) ${isMuted ? 0 : volume}%, rgba(232, 215, 181, 0.2) 100%)`
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Floating Corner Vinyl Disc (appears in the corner when player disappears on scroll) */}
      <AnimatePresence>
        {hasEntered && isScrolled && (
          <motion.div
            className="corner-mini-player-anchor"
            initial={{ scale: 0, opacity: 0, rotate: -120 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 120 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          >
            <button
              type="button"
              className={`corner-mini-vinyl-btn ${isPlaying ? 'is-playing' : ''} ${isExpandedOnScroll ? 'is-expanded' : ''}`}
              onClick={() => setIsExpandedOnScroll((prev) => !prev)}
              aria-label={isExpandedOnScroll ? 'प्लेयर समेटें (Collapse Player)' : 'संगीत प्लेयर खोलें (Open Player)'}
              title={isPlaying ? `“${songTitle}” बज रहा है • प्लेयर खोलें` : 'संगीत प्लेयर खोलें'}
            >
              <svg
                className={`corner-vinyl-svg ${isPlaying ? 'spinning' : ''}`}
                viewBox="0 0 100 100"
                width="40"
                height="40"
                aria-hidden="true"
              >
                <circle cx="50" cy="50" r="48" fill="#120F0C" stroke="var(--accent-gold)" strokeWidth="1.6" strokeOpacity="0.8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#26201A" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="#1D1814" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="24" fill="none" stroke="#2B2119" strokeWidth="1" />
                <circle cx="50" cy="50" r="15" fill="url(#cornerVinylLabelGrad)" stroke="var(--accent-red)" strokeWidth="1" />
                <circle cx="50" cy="50" r="4" fill="#0B0A08" stroke="var(--accent-gold)" strokeWidth="0.8" />
                <defs>
                  <radialGradient id="cornerVinylLabelGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#D4A35F" />
                    <stop offset="70%" stopColor="var(--accent-gold)" />
                    <stop offset="100%" stopColor="var(--accent-red)" />
                  </radialGradient>
                </defs>
              </svg>
              {isPlaying && <span className="corner-mini-pulse" aria-hidden="true" />}
            </button>

            {/* Clean Popup Player Card when user clicks corner vinyl while scrolled */}
            <AnimatePresence>
              {isExpandedOnScroll && (
                <motion.div
                  className="corner-expanded-player"
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  role="region"
                  aria-label="संगीत प्लेयर"
                >
                  <div className="corner-expanded-header">
                    <div className="corner-expanded-track">
                      <span className="corner-expanded-title" title={songTitle}>
                        {songTitle}
                      </span>
                      <span className="corner-expanded-artist" title={songArtist}>
                        {songArtist}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="corner-close-btn"
                      onClick={() => setIsExpandedOnScroll(false)}
                      aria-label="प्लेयर समेटें (Close)"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="corner-expanded-controls">
                    <button
                      type="button"
                      className="player-btn prev-btn"
                      onClick={onPrevious}
                      aria-label="पिछला गाना"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="player-btn play-pause-btn"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'रोकें' : 'चलाएं'}
                    >
                      {isPlaying ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      className="player-btn next-btn"
                      onClick={onNext}
                      aria-label="अगला गाना"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="player-btn volume-btn"
                      onClick={handleToggleMute}
                      aria-label={isMuted || volume === 0 ? 'आवाज़ खोलें' : 'आवाज़ बंद करें'}
                    >
                      {isMuted || volume === 0 ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="corner-expanded-timeline">
                    <span className="time-display">{formatTime(currentTime)}</span>
                    <div className="slider-container">
                      <input
                        type="range"
                        className="progress-slider"
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        value={currentTime || 0}
                        onChange={handleSeekChange}
                        aria-label="गीत की प्रगति"
                        style={{
                          background: `linear-gradient(to right, var(--accent-gold) 0%, var(--accent-gold) ${progressPercent}%, rgba(232, 215, 181, 0.2) ${progressPercent}%, rgba(232, 215, 181, 0.2) 100%)`
                        }}
                      />
                    </div>
                    <span className="time-display">{formatTime(duration)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
