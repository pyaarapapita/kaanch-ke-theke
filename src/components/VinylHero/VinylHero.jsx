import { motion, AnimatePresence } from 'framer-motion'
import './VinylHero.css'

/**
 * The hero's text, poster and framing. Its markup is part of the entry bundle and mounts
 * once. The 3D is ExperienceLayer, fixed behind the page, and the poster stays up until
 * that layer has drawn a real frame.
 */
export function VinylHero({
  hasEntered,
  isVideoTransitioning,
  handleStartEntryTransition,
  onEntryIntent,
  isSceneReady = false
}) {
  return (
    <>
      <div className="vinyl-hero-backdrop" aria-hidden="true" />
      <div
        className={`vinyl-static-fallback ${isSceneReady ? 'is-faded-out' : ''}`}
        role="img"
        aria-label="काँच के ठेके विनाइल रिकॉर्ड"
      />
      <div className="vinyl-vignette-overlay" aria-hidden="true" />

      <section
        className={`hero vinyl-hero-container ${hasEntered ? 'is-entered' : ''}`}
        aria-label="काँच के ठेके 3D विनाइल अनुभव"
      >
      {/* Foreground Content: Accessible Semantic HTML & Controls */}
      <div className="vinyl-hero-content">
        <div className="hero-content vinyl-hero-text-panel">
          <div className="title-wrapper">
            <h1 className="main-title">काँच के ठेके</h1>
            <p className="subtitle-english">
              KAANCH KE THEKE — Retro Bollywood Music &amp; Nostalgic Melodies
            </p>
          </div>

          <p className="tagline">
            अपने किरदार से महकता है इंसान, चरित्र पवित्र करने का इत्र नहीं आता
          </p>

          {/* The wrapper reserves the button's height so the text never moves on entry */}
          <div className="cta-wrapper">
            <AnimatePresence mode="wait" initial={false}>
              {!hasEntered && !isVideoTransitioning && (
                <motion.button
                  type="button"
                  className="cta-button"
                  onClick={handleStartEntryTransition}
                  onPointerEnter={onEntryIntent}
                  onTouchStart={onEntryIntent}
                  onFocus={onEntryIntent}
                  disabled={isVideoTransitioning}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  ठेके में प्रवेश करें
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </section>
    </>
  )
}
