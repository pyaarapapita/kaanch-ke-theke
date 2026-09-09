import React from 'react';

/**
 * YouTubePlayer component
 * Off-screen container element for YouTube IFrame API playback.
 */
export function YouTubePlayer({ containerRef }) {
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: '0px',
        left: '0px',
        width: '200px',
        height: '200px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -1
      }}
      aria-hidden="true"
    />
  );
}
