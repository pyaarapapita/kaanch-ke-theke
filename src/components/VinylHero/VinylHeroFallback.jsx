import './VinylHero.css'

export function VinylHeroFallback({
  hasEntered,
  isVideoTransitioning,
  handleStartEntryTransition
}) {
  return (
    <section
      className={`hero vinyl-hero-container ${hasEntered ? 'is-entered' : ''}`}
      aria-label="काँच के ठेके"
    >
      {/* Atmospheric High-Resolution Poster Background */}
      <div
        className="vinyl-static-fallback"
        style={{ backgroundImage: "url('/backgrounds/theka-bg.webp')" }}
        role="img"
        aria-label="काँच के ठेके विनाइल रिकॉर्ड"
      />

      {/* Atmospheric Warm Vignette Overlay */}
      <div className="vinyl-vignette-overlay" aria-hidden="true" />

      {/* Foreground Content: Accessible Semantic HTML & Controls */}
      <div className="vinyl-hero-content">
        <div className={`hero-content vinyl-hero-text-panel ${hasEntered ? 'receded' : ''}`}>
          <div className="title-wrapper">
            <h1 className="main-title">काँच के ठेके</h1>
            <p className="subtitle-english">
              KAANCH KE THEKE — Retro Bollywood Music &amp; Nostalgic Melodies
            </p>
          </div>

          <p className="tagline">
            अपने किरदार से महकता है इंसान, चरित्र पवित्र करने का इत्र नहीं आता
          </p>

          <div className="cta-wrapper">
            {!hasEntered && !isVideoTransitioning && (
              <button
                type="button"
                className="cta-button"
                onClick={handleStartEntryTransition}
                disabled={isVideoTransitioning}
              >
                ठेके में प्रवेश करें
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
