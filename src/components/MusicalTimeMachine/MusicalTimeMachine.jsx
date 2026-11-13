import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TIME_MACHINE_MOODS } from './timeMachineMoods'
import './MusicalTimeMachine.css'

export const MusicalTimeMachine = React.memo(function MusicalTimeMachine({
  onSelectPlaylist,
  handlePlaySong,
  currentPlaylist
}) {
  const navigate = useNavigate()
  const [selectedMood, setSelectedMood] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [activeCycleIndex, setActiveCycleIndex] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const spinTimerRef = useRef(null)
  const cycleIntervalRef = useRef(null)

  // Listen for reduced motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setIsReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current)
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current)
    }
  }, [])

  // Surprise Me: Random Mood Selection with cinematic vinyl spin
  const handleSurpriseMe = useCallback(() => {
    if (isSpinning) return

    // Choose a mood different from current
    let nextIndex = Math.floor(Math.random() * TIME_MACHINE_MOODS.length)
    if (selectedMood && TIME_MACHINE_MOODS[nextIndex].id === selectedMood.id) {
      nextIndex = (nextIndex + 1) % TIME_MACHINE_MOODS.length
    }

    if (isReducedMotion) {
      setSelectedMood(TIME_MACHINE_MOODS[nextIndex])
      return
    }

    setIsSpinning(true)

    // Rapid mood cycling effect
    let currentStep = 0
    const totalSteps = 12
    cycleIntervalRef.current = setInterval(() => {
      currentStep++
      setActiveCycleIndex((prev) => (prev + 1) % TIME_MACHINE_MOODS.length)
      if (currentStep >= totalSteps) {
        clearInterval(cycleIntervalRef.current)
      }
    }, 90)

    // Settle onto chosen mood after 1.25 seconds
    spinTimerRef.current = setTimeout(() => {
      setSelectedMood(TIME_MACHINE_MOODS[nextIndex])
      setIsSpinning(false)
      setActiveCycleIndex(nextIndex)
    }, 1250)
  }, [isSpinning, selectedMood, isReducedMotion])

  // Direct manual mood selection
  const handleSelectMoodPill = useCallback((mood) => {
    if (isSpinning) return
    setSelectedMood(mood)
  }, [isSpinning])

  // Navigate & Play selected mood
  const handleEnterMood = useCallback((mood) => {
    if (!mood) return
    if (typeof handlePlaySong === 'function' && mood.suggestedYoutubeId) {
      handlePlaySong(mood.suggestedYoutubeId, mood.playlistId)
    } else if (typeof onSelectPlaylist === 'function') {
      onSelectPlaylist(mood.playlistId)
    }
    navigate(`/playlists/${mood.playlistId}`)
  }, [handlePlaySong, onSelectPlaylist, navigate])

  const activeMood = selectedMood || (isSpinning ? TIME_MACHINE_MOODS[activeCycleIndex] : null)

  return (
    <section
      id="musical-time-machine"
      className="musical-time-machine-section"
      aria-label="संगीत का टाइम मशीन — आज की महफ़िल चुनें"
    >
      <div className="time-machine-container">
        {/* Section Header */}
        <div className="time-machine-header">
          <div className="editorial-badge-row">
            <span className="editorial-badge">टाइम मशीन • Nostalgic Time Machine</span>
            <span className="editorial-meta">ग्रामोफ़ोन, पुरानी डायरी और महफ़िल की तलाश</span>
          </div>
          <h2 className="editorial-title time-machine-main-title">
            संगीत का टाइम मशीन — आज का मिज़ाज चुनें
          </h2>
          <p className="editorial-desc time-machine-main-desc">
            पुराने दौर की संगीत की दुकान में जैसे किसी धूल जमी रिकॉर्ड रैक से अचानक कोई अनमोल विनाइल हाथ लग जाता था... पहिया घुमाइए और देखिए आज की रात आपकी रूह के लिए कौन सा नग़मा इंतज़ार कर रहा है।
          </p>
        </div>

        {/* Console Deck: Vinyl Gramophone + Interactive Mood Station */}
        <div className="time-machine-deck">
          {/* Left Column: Vintage Vinyl Platter */}
          <div className="time-machine-turntable-wrapper" aria-hidden="true">
            <div className="turntable-wood-cabinet">
              <div
                className={`turntable-platter-glow ${activeMood ? 'has-glow' : ''}`}
                style={{
                  background: activeMood
                    ? `radial-gradient(circle, ${activeMood.glowColor} 0%, transparent 70%)`
                    : 'radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, transparent 70%)'
                }}
              />

              <div
                className={`time-machine-vinyl-disc ${isSpinning ? 'is-spinning' : ''} ${activeMood ? 'is-settled' : ''}`}
              >
                <img
                  src="/backgrounds/vinyl-disc.webp"
                  alt="विनाइल रिकॉर्ड"
                  className="time-machine-disc-img"
                  loading="lazy"
                  decoding="async"
                  width="420"
                  height="420"
                />
              </div>

              {/* Brass Tonearm Graphic */}
              <div className={`turntable-tonearm ${isSpinning || activeMood ? 'on-groove' : 'on-rest'}`}>
                <div className="tonearm-pivot" />
                <div className="tonearm-wand" />
                <div className="tonearm-headshell" />
              </div>

              {/* Status Plate */}
              <div className="turntable-brass-plate">
                <span className="plate-rpm">33⅓ RPM • HI-FI</span>
                <span className="plate-status">
                  {isSpinning ? 'महफ़िल चुनी जा रही है...' : activeMood ? 'रिकॉर्ड तैयार है' : 'तलाश के लिए तैयार'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Mood Discovery Console */}
          <div className="time-machine-console">
            {/* Quick Mood Pills Carousel / Row */}
            <div className="time-machine-pills-row" role="region" aria-label="मिज़ाज चुनें">
              <span className="pills-label">मिज़ाज सूची:</span>
              <div className="pills-scroll-container">
                {TIME_MACHINE_MOODS.map((mood, idx) => {
                  const isCurrent = activeMood?.id === mood.id
                  const isCycled = isSpinning && activeCycleIndex === idx
                  const isPlaylistActive = currentPlaylist?.id === mood.playlistId
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      className={`time-machine-mood-pill ${isCurrent ? 'active-pill' : ''} ${isCycled ? 'cycled-pill' : ''} ${isPlaylistActive ? 'playlist-active-pill' : ''}`}
                      onClick={() => handleSelectMoodPill(mood)}
                      disabled={isSpinning}
                      aria-label={`${mood.titleHindi} (${mood.titleEnglish})${isPlaylistActive ? ' - सक्रिय' : ''}`}
                    >
                      <span className="pill-icon" aria-hidden="true">{mood.icon}</span>
                      <span className="pill-title">{mood.titleHindi}</span>
                      {isPlaylistActive && <span className="pill-active-dot" aria-hidden="true">●</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Central Surprise Action Button */}
            <div className="time-machine-action-banner">
              <button
                type="button"
                className={`surprise-me-main-btn ${isSpinning ? 'spinning' : ''}`}
                onClick={handleSurpriseMe}
                disabled={isSpinning}
                aria-label="आज की महफ़िल चुनें (Surprise Me with a Random Mood)"
              >
                <span className="surprise-btn-dice" aria-hidden="true">
                  {isSpinning ? '📻' : '🎲'}
                </span>
                <span className="surprise-btn-text">
                  {isSpinning ? 'महफ़िल खोजी जा रही है...' : selectedMood ? 'दूसरा मिज़ाज चुनें (Spin Again)' : 'आज की महफ़िल चुनें (Surprise Me)'}
                </span>
                <span className="surprise-btn-sub">
                  {isSpinning ? 'विनाइल घूम रहा है • Please wait' : 'किस्मत को एक नया नग़मा चुनने दें'}
                </span>
              </button>
            </div>

            {/* Discovered Mood Narrative Box */}
            <div className="time-machine-result-area" aria-live="polite">
              <AnimatePresence mode="wait">
                {activeMood ? (
                  <motion.div
                    key={activeMood.id}
                    className="discovered-mood-card"
                    style={{ '--mood-accent': activeMood.accentColor }}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <div className="discovered-card-header">
                      <div className="discovered-badge-group">
                        <span className="discovered-icon" aria-hidden="true">{activeMood.icon}</span>
                        <div className="discovered-meta-stack">
                          <span className="discovered-era-badge">{activeMood.eraBadge}</span>
                          <span className="discovered-playlist-tag">प्लेलिस्ट: {activeMood.playlistName}</span>
                          {currentPlaylist?.id === activeMood.playlistId && (
                            <span className="discovered-active-pill-tag">● वर्तमान में सक्रिय (Now Active)</span>
                          )}
                        </div>
                      </div>
                      <div className="discovered-status-badge">
                        <span>निकाला गया रिकॉर्ड</span>
                      </div>
                    </div>

                    <div className="discovered-card-body">
                      <h3 className="discovered-title">
                        <span className="title-hindi">{activeMood.titleHindi}</span>
                        <span className="title-english">— {activeMood.titleEnglish}</span>
                      </h3>
                      <p className="discovered-tagline">“{activeMood.tagline}”</p>
                      <p className="discovered-desc">{activeMood.description}</p>
                    </div>

                    {/* Highlight Track Preview */}
                    <div className="discovered-highlight-track">
                      <div className="highlight-track-header">
                        <span className="highlight-track-icon" aria-hidden="true">🎵</span>
                        <span className="highlight-track-label">सुझाया गया पहला नग़मा (Recommended Track):</span>
                      </div>
                      <div className="highlight-track-info">
                        <strong className="track-name">{activeMood.highlightSong}</strong>
                        <span className="track-artist">— {activeMood.highlightArtist}</span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="discovered-actions-row">
                      <button
                        type="button"
                        className="enter-discovered-mood-btn"
                        onClick={() => handleEnterMood(activeMood)}
                        aria-label={`${activeMood.titleHindi} महफ़िल में उतरें`}
                      >
                        <span>इस महफ़िल में उतरें (Enter Playlist) →</span>
                      </button>

                      <Link
                        to={`/playlists/${activeMood.playlistId}`}
                        className="view-discovered-playlist-link"
                        aria-label={`${activeMood.playlistName} का पूरा विवरण देखें`}
                      >
                        <span>विवरण व ट्रैकलिस्ट देखें</span>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="invitation-placeholder"
                    className="time-machine-invitation-box"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="invitation-icon" aria-hidden="true">📻</div>
                    <h3 className="invitation-title">आज का सुरूर आपकी पसंद पर छोड़ दिया गया है</h3>
                    <p className="invitation-desc">
                      ऊपर दिए गए बटन <strong>"आज की महफ़िल चुनें"</strong> पर क्लिक करें, या किसी भी मिज़ाज पर टैप करके उसकी दास्तान और धुनें खोजें।
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})
