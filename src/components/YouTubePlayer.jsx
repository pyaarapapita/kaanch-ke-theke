/**
 * YouTubePlayer component
 * Off-screen container element for YouTube IFrame API playback.
 * Maintained at 200x200px off-screen to comply with YouTube HTML5 Player minimum dimensions.
 */
export function YouTubePlayer({ containerRef }) {
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: '-300px',
        left: '-300px',
        width: '200px',
        height: '200px',
        opacity: 0.01,
        pointerEvents: 'none',
        zIndex: -9999
      }}
      aria-hidden="true"
    />
  );
}
