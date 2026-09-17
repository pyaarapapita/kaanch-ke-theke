import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
  const isVisible = hasEntered && !isScrolled;

  const currentMins = Math.floor(currentTime / 60);
  const currentSecs = Math.floor(currentTime % 60);
  const timeValueText = currentMins > 0 ? `${currentMins} मिनट ${currentSecs} सेकंड` : `${currentSecs} सेकंड`;
  const volumeValueText = `${isMuted ? 0 : volume} प्रतिशत`;

  return (
    <motion.div
      className={`cinematic-player-wrapper ${isScrolled ? 'is-scrolled-hidden' : ''}`}
      initial={false}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={{
        hidden: { y: 80, x: '-50%', opacity: 0, scale: 0.98, pointerEvents: 'none' },
        visible: { y: 0, x: '-50%', opacity: 1, scale: 1, pointerEvents: 'auto' }
      }}
      transition={{ duration: 0.4, delay: isVisible ? 0.15 : 0, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="cinematic-player">
        {/* Artwork / Vinyl Record Badge */}
        <div className="player-artwork" title={isPlaying ? 'संगीत चालू है (Vinyl Spinning)' : 'संगीत रुका हुआ है (Vinyl Paused)'}>
          <svg
            className={`vinyl-record ${isPlaying ? 'playing' : ''}`}
            viewBox="0 0 100 100"
            width="44"
            height="44"
            aria-hidden="true"
          >
            {/* Outer Vinyl Edge */}
            <circle cx="50" cy="50" r="48" fill="#120F0C" stroke="var(--accent-gold)" strokeWidth="1.2" strokeOpacity="0.7" />

            {/* Record Grooves (Subtle concentric rings) */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="#26201A" strokeWidth="1" opacity="0.85" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#1A1511" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="31" fill="none" stroke="#2E251E" strokeWidth="0.8" opacity="0.9" />
            <circle cx="50" cy="50" r="26" fill="none" stroke="#1D1814" strokeWidth="1" />
            <circle cx="50" cy="50" r="21" fill="none" stroke="#332921" strokeWidth="0.8" opacity="0.7" />

            {/* Sheen Highlight */}
            <path d="M 16 16 L 84 84" stroke="rgba(232, 215, 181, 0.09)" strokeWidth="14" strokeLinecap="round" />

            {/* Center Gold/Red Label */}
            <circle cx="50" cy="50" r="15" fill="url(#vinylLabelGrad)" stroke="var(--accent-red)" strokeWidth="1" />

            {/* Center Spindle Hole */}
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

        {/* Track Details & Optional Error Notice */}
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
            <span className="player-error-tag" title="ग़ना चलाने में समस्या आई">
              पुनः प्रयास करें
            </span>
          )}
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

        {/* Volume Control */}
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
  );
});
