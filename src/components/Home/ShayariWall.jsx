import { memo, useCallback, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SHAYARI_COLLECTION, toDevanagari } from './homeContent'

const SWIPE_DISTANCE = 60

/** A sher at a time, set large. Buttons, arrow keys or a swipe turn the page. */
export const ShayariWall = memo(function ShayariWall() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const prefersReducedMotion = useReducedMotion()
  const total = SHAYARI_COLLECTION.length
  const sher = SHAYARI_COLLECTION[index]

  const step = useCallback((delta) => {
    setDirection(delta)
    setIndex((current) => (current + delta + total) % total)
  }, [total])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    }
  }

  const handleDragEnd = (_, info) => {
    if (info.offset.x <= -SWIPE_DISTANCE) step(1)
    else if (info.offset.x >= SWIPE_DISTANCE) step(-1)
  }

  const travel = prefersReducedMotion ? 0 : 36

  return (
    <div
      className="shayari"
      role="group"
      aria-roledescription="carousel"
      aria-label="महफ़िल की शायरी"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <span className="shayari-mark" aria-hidden="true">“</span>

      <div className="shayari-stage" aria-live="polite">
        {/* Every sher, invisible, in the same grid cell: the stage is always as tall as the
            longest one at this width, so turning the page never moves what follows. */}
        {SHAYARI_COLLECTION.map((item) => (
          <div key={item.id} className="shayari-figure shayari-sizer" aria-hidden="true">
            <div className="shayari-text">
              {item.sher.split('\n').map((line) => (
                <span key={line} className="shayari-line">{line}</span>
              ))}
            </div>
            <div className="shayari-credit">
              <span className="shayari-poet">— {item.poet}</span>
              <span className="shayari-era">{item.era}</span>
              <span className="shayari-context">{item.context}</span>
            </div>
          </div>
        ))}
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.figure
            key={sher.id}
            className="shayari-figure"
            custom={direction}
            initial={{ opacity: 0, x: travel * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -travel * direction }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            drag={prefersReducedMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
          >
            <blockquote className="shayari-text">
              {sher.sher.split('\n').map((line) => (
                <span key={line} className="shayari-line">{line}</span>
              ))}
            </blockquote>
            <figcaption className="shayari-credit">
              <span className="shayari-poet">— {sher.poet}</span>
              <span className="shayari-era">{sher.era}</span>
              <span className="shayari-context">{sher.context}</span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      <div className="shayari-controls">
        <button type="button" className="round-btn" onClick={() => step(-1)} aria-label="पिछला शेर">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="shayari-count">
          <span className="visually-hidden">शेर {index + 1}, कुल {total}</span>
          <span aria-hidden="true">{toDevanagari(index + 1)}</span>
          <span className="shayari-count-sep" aria-hidden="true">/</span>
          <span aria-hidden="true">{toDevanagari(total)}</span>
        </span>
        <button type="button" className="round-btn" onClick={() => step(1)} aria-label="अगला शेर">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
})
