import React, { useState, useCallback } from 'react'

const LANTERN_LEVELS = [
  { level: 'medium', label: 'मध्यम लौ', glowPx: 35, opacity: 0.8 },
  { level: 'bright', label: 'तेज़ रौशनी', glowPx: 55, opacity: 1 },
  { level: 'dim', label: 'धीमी लौ', glowPx: 20, opacity: 0.55 }
]

/**
 * Atmospheric Kerosene Lantern on the Theka Counter
 * Tapping cycles the flame brightness and adjusts the counter's ambient warmth.
 */
export const ThekaLantern = React.memo(function ThekaLantern({
  onFlameChange
}) {
  const [levelIndex, setLevelIndex] = useState(0)
  const currentLevel = LANTERN_LEVELS[levelIndex]

  const handleToggleFlame = useCallback(() => {
    const nextIdx = (levelIndex + 1) % LANTERN_LEVELS.length
    setLevelIndex(nextIdx)
    if (onFlameChange) {
      onFlameChange(LANTERN_LEVELS[nextIdx].level)
    }
  }, [levelIndex, onFlameChange])

  return (
    <div
      className={`theka-lantern-interactive level-${currentLevel.level}`}
      role="button"
      tabIndex={0}
      onClick={handleToggleFlame}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleToggleFlame()
        }
      }}
      aria-label={`पीतल की लालटेन — ${currentLevel.label}। क्लिक करके लौ बदलें।`}
      title="लालटेन पर क्लिक करके लौ बदलें (Toggle Lantern Glow)"
    >
      {/* Lantern Top Ring & Hood */}
      <div className="lantern-top-ring" aria-hidden="true" />
      <div className="lantern-brass-hood" aria-hidden="true">
        <span className="hood-vents" />
      </div>

      {/* Glass Chimney with Flickering Flame */}
      <div className="lantern-glass-chimney">
        <div
          className="lantern-flame"
          style={{
            boxShadow: `0 0 ${currentLevel.glowPx}px #FFAA22, 0 0 ${currentLevel.glowPx * 1.5}px rgba(255, 140, 20, 0.4)`
          }}
        >
          <span className="flame-core" />
          <span className="flame-corona" />
        </div>
        <div className="chimney-glass-reflection" />
      </div>

      {/* Brass Base Tank */}
      <div className="lantern-brass-base" aria-hidden="true">
        <span className="wick-knob" />
      </div>

      {/* Interactive Micro-Hint */}
      <span className="lantern-hint-tag">{currentLevel.label} 🕯️</span>
    </div>
  )
})
