import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getPlaylistById, DEFAULT_PLAYLIST_ID, PLAYLISTS } from './data/playlists'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { YouTubePlayer } from './components/YouTubePlayer'
import { MusicPlayer } from './components/MusicPlayer'
import { MoodSelector } from './components/MoodSelector'
import { HomePageView } from './components/HomePageView'
import { ExperienceLayer } from './components/Experience/ExperienceLayer'
import { fetchPlaylistMetadata } from './utils/youtubeMetadata'
import './App.css'

// Dynamic lazy imports for non-critical routes and deferred components
import { PlaylistsPage, PlaylistDetailPage, NotFoundPage, preloadPlaylistRoutes } from './utils/routePages'
const VisitorCounter = lazy(() => import('./components/VisitorCounter'))

const ENTRY_VIDEO_SRC = '/shopkeeper-entry-720.mp4'
const ENTRY_VIDEO_POSTER = '/backgrounds/shopkeeper-entry-poster.webp'
// The inline script in index.html reads this same key before first paint.
const ENTRY_SESSION_KEY = 'kkt-entry-played'
// Matches the .is-fading transition in App.css; the extra time is a safety margin.
const ENTRY_CROSSFADE_MS = 700
// Give up on a video that cannot start or has stalled, and enter the site instead.
const ENTRY_STALL_TIMEOUT_MS = 5000

function hasPlayedEntryThisSession() {
  try {
    return window.sessionStorage.getItem(ENTRY_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function markEntryPlayed() {
  try {
    window.sessionStorage.setItem(ENTRY_SESSION_KEY, '1')
  } catch {
    // Without storage the video simply plays again next time.
  }
}

// How much of the entry video to fetch before anyone asks for it.
function getIdleVideoPreload() {
  const connection = navigator.connection
  if (!connection) return 'auto'
  if (connection.saveData || /2g$/.test(connection.effectiveType || '')) return 'none'
  return connection.effectiveType === '3g' ? 'metadata' : 'auto'
}

// Configuration for external profile/support links
const SITE_CONFIG = {
  INSTAGRAM_URL: 'https://www.instagram.com/ironically_anujj',
  BUY_ME_A_COFFEE_URL: 'https://buymeacoffee.com/kaanchketheke'
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Standalone public routes (/playlists, /playlists/:id) enter directly without landing modal blocking.
  // The homepage skips the gate too once the entry video has played in this browser session.
  const [hasEntered, setHasEntered] = useState(() => (
    typeof window !== 'undefined' && (window.location.pathname !== '/' || hasPlayedEntryThisSession())
  ))
  // idle -> playing -> revealing (page switches under the video) -> fading -> done
  const [entryPhase, setEntryPhase] = useState('idle')
  const [videoPreload, setVideoPreload] = useState('none')
  const isVideoTransitioning = entryPhase === 'playing'
  const [isExperienceReady, setIsExperienceReady] = useState(false)
  const handleExperienceReady = useCallback(() => setIsExperienceReady(true), [])
  const handleExperienceLost = useCallback(() => setIsExperienceReady(false), [])
  const [showAbout, setShowAbout] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [dynamicPlaylists, setDynamicPlaylists] = useState(PLAYLISTS)
  const [currentPlaylistId, setCurrentPlaylistId] = useState(DEFAULT_PLAYLIST_ID)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [autoSkipMessage, setAutoSkipMessage] = useState(null)

  const currentPlaylist = useMemo(() => {
    return dynamicPlaylists.find((p) => p.id === currentPlaylistId) || dynamicPlaylists[0]
  }, [dynamicPlaylists, currentPlaylistId])

  const aboutBtnRef = useRef(null)
  const closeBtnRef = useRef(null)
  const videoRef = useRef(null)

  const playlistSongs = useMemo(() => currentPlaylist?.songs || [], [currentPlaylist])

  // A new route starts at the top. Choosing a playlist is not navigation and keeps the scroll position.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Synchronize route URL parameter with active playlist state
  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMobileMenuOpen(false)
      if (location.pathname !== '/') {
        setHasEntered(true)
        if (location.pathname.startsWith('/playlists/')) {
          const targetId = location.pathname.replace('/playlists/', '').trim()
          if (targetId && targetId !== currentPlaylistId) {
            setCurrentPlaylistId(targetId)
          }
        }
      }
    })
  }, [location.pathname, currentPlaylistId])

  // Scroll position tracking to control header panel & MusicPlayer visibility
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement?.scrollTop || 0
          const scrolled = scrollTop > 60
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev))
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleLogoClick = useCallback(() => {
    if (location.pathname !== '/') {
      navigate('/')
    } else {
      const currentScroll = window.pageYOffset || window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0
      if (currentScroll > 10) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const scrollConfig = { top: 0, left: 0, behavior: prefersReduced ? 'auto' : 'smooth' }
        try { window.scrollTo(scrollConfig) } catch { window.scrollTo(0, 0) }
      }
    }
  }, [location.pathname, navigate])

  // Lock scroll only when pre-entry gate is active on homepage or about modal is open
  useEffect(() => {
    if ((!hasEntered && location.pathname === '/') || showAbout) {
      const originalOverflow = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'

      const focusTimer = setTimeout(() => {
        if (showAbout) closeBtnRef.current?.focus()
      }, 50)

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (showAbout) setShowAbout(false)
          if (isMobileMenuOpen) setIsMobileMenuOpen(false)
        }
      }
      window.addEventListener('keydown', handleKeyDown)

      return () => {
        clearTimeout(focusTimer)
        document.body.style.overflow = originalOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [hasEntered, showAbout, isMobileMenuOpen, location.pathname])

  // Fetch playlist metadata automatically on mount / playlist change
  useEffect(() => {
    let isMounted = true
    const plId = currentPlaylist?.youtubePlaylistId
    if (plId) {
      Promise.resolve().then(() => {
        if (isMounted) setIsLoadingMetadata(true)
      })
      fetchPlaylistMetadata(plId).then((result) => {
        if (isMounted) {
          setIsLoadingMetadata(false)
          if (result?.items && result.items.length > 0) {
            setDynamicPlaylists((prevPlaylists) =>
              prevPlaylists.map((pl) => {
                if (pl.youtubePlaylistId === plId) {
                  return { ...pl, songs: result.items }
                }
                return pl
              })
            )
          }
        }
      }).catch((err) => {
        console.warn('[App] fetchPlaylistMetadata error:', err)
        if (isMounted) setIsLoadingMetadata(false)
      })
    }
    return () => {
      isMounted = false
    }
  }, [currentPlaylist?.youtubePlaylistId])

  const handleNextSongRef = useRef(null)

  const {
    containerRef,
    isReady,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    playSongId,
    playPlaylistId,
    togglePlay,
    seekTo,
    setVolume,
    retryCurrent
  } = useYouTubePlayer({
    youtubeId: playlistSongs[currentSongIndex]?.youtubeId || 'Ax5jPATJM1A',
    onSongEnd: () => {
      handleNextSongRef.current?.()
    },
    onError: (err) => {
      console.warn('[App] Playback error notice:', err)
      if (err?.code === 101 || err?.code === 150) {
        setAutoSkipMessage('ये गाना नहीं बज पाया... अगली बोतल खोलते हैं।')
        setTimeout(() => setAutoSkipMessage(null), 3000)
      }
    }
  })

  const handleNextSong = useCallback(() => {
    if (!playlistSongs.length) return
    const nextIndex = (currentSongIndex + 1) % playlistSongs.length
    setCurrentSongIndex(nextIndex)
    const nextSong = playlistSongs[nextIndex]
    if (nextSong?.youtubeId) {
      playSongId(nextSong.youtubeId)
    }
  }, [playlistSongs, currentSongIndex, playSongId])

  const handlePreviousSong = useCallback(() => {
    if (!playlistSongs.length) return
    const prevIndex = (currentSongIndex - 1 + playlistSongs.length) % playlistSongs.length
    setCurrentSongIndex(prevIndex)
    const prevSong = playlistSongs[prevIndex]
    if (prevSong?.youtubeId) {
      playSongId(prevSong.youtubeId)
    }
  }, [playlistSongs, currentSongIndex, playSongId])

  useEffect(() => {
    handleNextSongRef.current = handleNextSong
  }, [handleNextSong])

  // Keyboard Spacebar shortcut for Play/Pause toggle
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        const target = event.target
        const tagName = target?.tagName?.toLowerCase()
        const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'
        const isEditable = target?.isContentEditable || target?.getAttribute('contenteditable') === 'true' || target?.getAttribute('contenteditable') === ''

        if (isInput || isEditable) {
          return
        }

        event.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePlay])

  // Resolve currentSong dynamically with memoization
  const currentSong = useMemo(() => {
    return playlistSongs[currentSongIndex] || {
      id: 'default-song',
      title: 'काँच के ठेके',
      artist: 'आज कुछ पुराना सुनते हैं',
      youtubeId: 'Ax5jPATJM1A'
    }
  }, [playlistSongs, currentSongIndex])

  const handlePlaySong = useCallback((songId, playlistId = null) => {
    setHasEntered(true)
    setShowAbout(false)

    let targetPlaylist = currentPlaylist
    if (playlistId) {
      targetPlaylist = dynamicPlaylists.find((p) => p.id === playlistId) || getPlaylistById(playlistId)
      setCurrentPlaylistId(playlistId)
    }

    const songs = targetPlaylist?.songs || playlistSongs
    const songIndex = songs.findIndex((s) => s.youtubeId === songId || s.id === songId)
    if (songIndex !== -1 && songIndex !== undefined) {
      setCurrentSongIndex(songIndex)
    }

    if (songId) {
      playSongId(songId)
    } else if (targetPlaylist?.youtubePlaylistId) {
      playPlaylistId(targetPlaylist.youtubePlaylistId)
    }
  }, [currentPlaylist, dynamicPlaylists, playlistSongs, playSongId, playPlaylistId])

  const handleSelectPlaylist = useCallback((playlistId) => {
    setCurrentPlaylistId(playlistId)
    const selected = dynamicPlaylists.find((p) => p.id === playlistId) || getPlaylistById(playlistId)
    setCurrentSongIndex(0)
    setHasEntered(true)

    const songs = selected?.songs || []
    const targetSong = songs.find((s) => Boolean(s.youtubeId)) || songs[0]
    if (targetSong?.youtubeId) {
      playSongId(targetSong.youtubeId)
    } else if (selected?.youtubePlaylistId) {
      playPlaylistId(selected.youtubePlaylistId)
    }
  }, [dynamicPlaylists, playPlaylistId, playSongId])

  const handleEnterTheka = useCallback(() => {
    setHasEntered(true)
    setShowAbout(false)

    const targetSong = playlistSongs[currentSongIndex] || playlistSongs.find((s) => Boolean(s.youtubeId))
    if (targetSong?.youtubeId) {
      playSongId(targetSong.youtubeId)
    } else if (currentPlaylist?.youtubePlaylistId) {
      playPlaylistId(currentPlaylist.youtubePlaylistId)
    }
  }, [currentPlaylist, playPlaylistId, currentSongIndex, playlistSongs, playSongId])

  const entryDoneRef = useRef(false)
  const stallTimerRef = useRef(null)
  const completeEntryRef = useRef(() => {})

  const clearStallTimer = useCallback(() => {
    clearTimeout(stallTimerRef.current)
  }, [])

  const armStallTimer = useCallback(() => {
    clearTimeout(stallTimerRef.current)
    stallTimerRef.current = setTimeout(() => completeEntryRef.current(), ENTRY_STALL_TIMEOUT_MS)
  }, [])

  const handleEntryIntent = useCallback(() => {
    setVideoPreload('auto')
  }, [])

  const handleStartEntryTransition = useCallback(() => {
    if (entryPhase !== 'idle' || hasEntered) return
    setVideoPreload('auto')
    setEntryPhase('playing')
    setShowAbout(false)
  }, [entryPhase, hasEntered])

  // Also the skip action: it fades from whichever frame is showing.
  const completeEntryTransition = useCallback(() => {
    if (entryDoneRef.current) return
    entryDoneRef.current = true
    clearTimeout(stallTimerRef.current)
    try { videoRef.current?.pause() } catch (e) { console.warn(e) }
    markEntryPlayed()
    handleEnterTheka()
    setEntryPhase('revealing')
  }, [handleEnterTheka])

  useEffect(() => {
    completeEntryRef.current = completeEntryTransition
  }, [completeEntryTransition])

  const handleVideoError = useCallback((err) => {
    console.warn('[App] Entry video load error:', err)
    if (entryPhase === 'playing') completeEntryRef.current()
  }, [entryPhase])

  // Start playback once. This must not depend on the completion handler: its identity
  // changes when playlist metadata arrives, which would restart the video mid-play.
  useEffect(() => {
    if (entryPhase !== 'playing') return
    const video = videoRef.current
    armStallTimer()
    if (video) {
      video.currentTime = 0
      video.play()?.catch((err) => {
        console.warn('[App] Video play request failed:', err)
        completeEntryRef.current()
      })
    }
    return clearStallTimer
  }, [entryPhase, armStallTimer, clearStallTimer])

  // The page below just changed state. Let that paint, so its layout work
  // happens behind the opaque video and not during the crossfade.
  useEffect(() => {
    if (entryPhase !== 'revealing') return
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setEntryPhase('fading'))
    })
    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [entryPhase])

  useEffect(() => {
    if (entryPhase !== 'fading') return
    const timer = setTimeout(() => setEntryPhase('done'), ENTRY_CROSSFADE_MS + 150)
    return () => clearTimeout(timer)
  }, [entryPhase])

  const handleOverlayTransitionEnd = useCallback((e) => {
    if (e.target === e.currentTarget && e.propertyName === 'opacity' && entryPhase === 'fading') {
      setEntryPhase('done')
    }
  }, [entryPhase])

  // Warm up the entry video after the page has loaded, sized to the connection.
  useEffect(() => {
    if (hasEntered || location.pathname !== '/') return
    const target = getIdleVideoPreload()
    if (target === 'none') return

    let idleId = 0
    let timerId = 0
    const warm = () => setVideoPreload((current) => (current === 'auto' ? current : target))
    const schedule = () => {
      if (window.requestIdleCallback) {
        idleId = window.requestIdleCallback(warm, { timeout: 3000 })
      } else {
        timerId = setTimeout(warm, 1500)
      }
    }

    if (document.readyState === 'complete') {
      schedule()
    } else {
      window.addEventListener('load', schedule, { once: true })
    }

    return () => {
      window.removeEventListener('load', schedule)
      if (idleId) window.cancelIdleCallback?.(idleId)
      clearTimeout(timerId)
    }
  }, [hasEntered, location.pathname])

  // Honor a CTA click that landed on the static shell before React mounted.
  useEffect(() => {
    if (!window.__kktPendingEntry) return
    window.__kktPendingEntry = false
    Promise.resolve().then(handleStartEntryTransition)
  }, [handleStartEntryTransition])

  // Fetch the playlist pages in the background so opening them has no loading gap.
  useEffect(() => {
    const preload = () => { preloadPlaylistRoutes().catch(() => {}) }
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(preload, { timeout: 8000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const timer = setTimeout(preload, 4000)
    return () => clearTimeout(timer)
  }, [])

  const isEntrySequenceActive = entryPhase !== 'idle' && entryPhase !== 'done'
  const showEntryOverlay = isEntrySequenceActive || (!hasEntered && videoPreload !== 'none')

  return (
    <div className={`landing-container ${hasEntered ? 'is-entered' : ''}`}>
      {/* Hidden YouTube IFrame Player Instance */}
      <YouTubePlayer containerRef={containerRef} />

      {/* Persistent bar background, identical in the static shell, before and after entry */}
      <div className="bg-placeholder" aria-hidden="true">
        <div className="bg-image" />
        <div className="ambient-glow" />
        <div className="overlay-vignette" />
        <div className="film-grain" />
      </div>

      {/* Persistent 3D, fixed behind all page content */}
      <ExperienceLayer
        isHome={location.pathname === '/'}
        isCovered={isVideoTransitioning}
        isPlaying={isPlaying}
        hasEntered={hasEntered}
        activePlaylistId={currentPlaylist?.id}
        onReady={handleExperienceReady}
        onLost={handleExperienceLost}
      />

      {/* Entry video: always above the page, crossfades away, then unmounts */}
      {showEntryOverlay && (
        <div
          className={`video-entry-overlay is-${entryPhase}`}
          aria-hidden={entryPhase !== 'playing'}
          onTransitionEnd={handleOverlayTransitionEnd}
        >
          <video
            ref={videoRef}
            className="cinematic-entry-video"
            src={ENTRY_VIDEO_SRC}
            poster={ENTRY_VIDEO_POSTER}
            preload={videoPreload}
            muted
            playsInline
            onEnded={completeEntryTransition}
            onError={handleVideoError}
            onPlaying={clearStallTimer}
            onWaiting={armStallTimer}
          />

          {/* Accessible Skip Intro Button during Video Playback */}
          {entryPhase === 'playing' && (
            <motion.button
              type="button"
              className="video-skip-btn"
              onClick={completeEntryTransition}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, delay: 0.2 }}
              aria-label="परिचय छोड़ें (Skip Intro)"
            >
              <span className="skip-text-hindi">छोड़ें</span>
              <span className="skip-text-english">(Skip)</span>
              <span className="skip-arrow" aria-hidden="true">→</span>
            </motion.button>
          )}

          <div className="ambient-glow" />
          <div className="overlay-vignette" />
          <div className="film-grain" />
        </div>
      )}

      {/* Header Navigation Controls */}
      <header className={`header ${isScrolled ? 'is-scrolled' : ''}`}>
        <Link
          to="/"
          className="brand brand-btn"
          onClick={() => {
            handleLogoClick()
            setIsMobileMenuOpen(false)
          }}
          aria-label="काँच के ठेके — मुख्य पृष्ठ"
          style={{ textDecoration: 'none' }}
        >
          <span className="brand-title-hindi">काँच के ठेके</span>
          <span className="brand-title-english">KAANCH KE THEKE</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav">
          <div className="support-nav-item">
            <a
              href={SITE_CONFIG.BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-support-btn"
              aria-label="मेरी अगली बोतल के लिए (Support Creator)"
            >
              मेरी अगली बोतल के लिए
            </a>
          </div>

          <AnimatePresence initial={false}>
            {hasEntered && !isScrolled && (
              <motion.div
                key="header-mood-selector"
                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ overflow: 'visible', display: 'inline-flex', alignItems: 'center' }}
              >
                <MoodSelector
                  playlists={dynamicPlaylists}
                  activePlaylistId={currentPlaylist?.id}
                  onSelectPlaylist={handleSelectPlaylist}
                  isScrolled={isScrolled}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            ref={aboutBtnRef}
            type="button"
            className="nav-link nav-link-btn"
            aria-expanded={showAbout}
            aria-controls="about-modal"
            onClick={() => setShowAbout((prev) => !prev)}
          >
            बारे में
          </button>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'is-active' : ''}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? 'मेनू बंद करें' : 'मेनू खोलें'}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="mobile-toggle-icon">{isMobileMenuOpen ? '✕' : '☰'}</span>
          <span className="mobile-toggle-label">{isMobileMenuOpen ? 'बंद करें' : 'मेनू'}</span>
        </button>
      </header>

      {/* Mobile Navigation Drawer / Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              className="mobile-nav-drawer"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-drawer-header">
                <Link
                  to="/"
                  className="mobile-brand-title mobile-brand-title-link"
                  onClick={() => {
                    handleLogoClick()
                    setIsMobileMenuOpen(false)
                  }}
                  aria-label="काँच के ठेके — मुख्य पृष्ठ पर जाएं"
                >
                  <span className="brand-title-hindi">काँच के ठेके</span>
                  <span className="mobile-brand-tagline">रेट्रो संगीत &amp; महफ़िल</span>
                </Link>
                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="मेनू बंद करें"
                >
                  ✕
                </button>
              </div>

              <div className="mobile-drawer-body">
                <div className="mobile-nav-action-grid">
                  <button
                    type="button"
                    className="mobile-nav-card-btn"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setShowAbout(true)
                    }}
                  >
                    <div className="mobile-card-text">
                      <span className="mobile-card-title">बारे में</span>
                      <span className="mobile-card-sub">ठेके की कहानी</span>
                    </div>
                  </button>
                </div>

                <a
                  href={SITE_CONFIG.BUY_ME_A_COFFEE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-support-banner-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>मेरी अगली बोतल के लिए</span>
                  <span className="mobile-support-sub">Support Creator</span>
                </a>

                {/* Integrated Mobile Mood Selector */}
                {hasEntered && (
                  <div className="mobile-mood-wrapper">
                    <div className="mobile-mood-header">
                      <span className="mobile-mood-title">मूड चुनिए (Mood Selector)</span>
                    </div>
                    <div className="mobile-mood-list">
                      {dynamicPlaylists.map((pl) => {
                        const isSelected = pl.id === currentPlaylist?.id
                        const isUpcoming = Boolean(pl.isUpcoming)
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            className={`mobile-mood-item ${isSelected ? 'selected' : ''} ${isUpcoming ? 'upcoming' : ''}`}
                            onClick={() => {
                              if (!isUpcoming) {
                                handleSelectPlaylist(pl.id)
                                setIsMobileMenuOpen(false)
                              }
                            }}
                            disabled={isUpcoming}
                          >
                            <div className="mobile-mood-item-row">
                              <span className="mobile-mood-name">{pl.name}</span>
                              {isSelected && <span className="mobile-active-dot">● सक्रिय</span>}
                              {isUpcoming && <span className="mobile-upcoming-chip">शीघ्र</span>}
                            </div>
                            <span className="mobile-mood-desc">{pl.description}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Application Routes */}
      <Suspense
        fallback={
          <div className="route-loading-fallback" role="status">
            <span className="route-loading-text">महफ़िल सज रही है…</span>
          </div>
        }
      >
        <Routes>
        <Route
          path="/"
          element={
            <HomePageView
              hasEntered={hasEntered}
              isVideoTransitioning={isVideoTransitioning}
              playlists={dynamicPlaylists}
              currentPlaylist={currentPlaylist}
              isPlaying={isPlaying}
              handleStartEntryTransition={handleStartEntryTransition}
              onEntryIntent={handleEntryIntent}
              isSceneReady={isExperienceReady}
              handleSelectPlaylist={handleSelectPlaylist}
              handlePlaySong={handlePlaySong}
              setShowAbout={setShowAbout}
            />
          }
        />

        <Route
          path="/playlists"
          element={
            <PlaylistsPage
              currentPlaylist={currentPlaylist}
              playlists={dynamicPlaylists}
              onSelectPlaylist={handleSelectPlaylist}
            />
          }
        />

        <Route
          path="/playlists/:id"
          element={
            <PlaylistDetailPage
              currentPlaylist={currentPlaylist}
              playlists={dynamicPlaylists}
              onSelectPlaylist={handleSelectPlaylist}
              onPlaySong={playSongId}
            />
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
      </Suspense>

      {/* Custom Floating Music Player */}
      <MusicPlayer
        hasEntered={hasEntered}
        isScrolled={isScrolled}
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        togglePlay={togglePlay}
        seekTo={seekTo}
        setVolume={setVolume}
        onNext={handleNextSong}
        onPrevious={handlePreviousSong}
        playbackError={error}
        isReady={isReady}
        isLoadingMetadata={isLoadingMetadata}
        autoSkipMessage={autoSkipMessage}
        onRetry={retryCurrent}
      />

      {/* Accessible Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            className="modal-backdrop"
            onClick={() => setShowAbout(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              id="about-modal"
              className="modal-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="about-title"
              aria-describedby="about-desc"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <button
                ref={closeBtnRef}
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAbout(false)}
                aria-label="बंद करें (Close)"
              >
                ✕
              </button>
              <div className="about-content">
                <h2 id="about-title" className="about-title">महफ़िल का अपना म्यूज़िक</h2>
                <p id="about-desc" className="about-description">
                  काँच के ठेके दोस्तों की महफ़िल और सुहानी शामों के लिए एक रेडी-मेड बॉलीवुड म्यूज़िक अनुभव है। यहाँ आपको पुराने, नॉस्टैल्जिक और मिक्स्ड हिंदी गानों का बेहतरीन संगम मिलता है—बिना खुद प्लेलिस्ट बनाने की झंझट के। बस अपनी पसंद का मूड चुनें और गानों का लुत्फ़ उठाएं।
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creator signature & atmospheric footer */}
      <footer className={`footer-atmosphere ${hasEntered ? 'entered' : ''}`}>
        <div className="footer-content-container">
          <div className="footer-brand-summary">
            <span className="footer-brand-title">काँच के ठेके</span>
            <span className="footer-brand-sub">नॉस्टैल्जिक बॉलीवुड संगीत, 90s के सदाबहार नग़मे और महफ़िल का सुकून।</span>
          </div>

          <nav className="footer-nav-links" aria-label="फुटर नेविगेशन">
            <Link to="/" className="footer-nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              मुख्य पृष्ठ (Home)
            </Link>
            <Link to="/playlists" className="footer-nav-link">
              सभी प्लेलिस्ट्स (Playlists)
            </Link>
            <button
              type="button"
              className="footer-nav-link footer-nav-btn"
              onClick={() => setShowAbout(true)}
            >
              बारे में (About)
            </button>
            <a
              href={SITE_CONFIG.BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-nav-link footer-support-link"
            >
              सहयोग करें
            </a>
            <a
              href={SITE_CONFIG.INSTAGRAM_URL}
              target="_blank"
              rel="me noopener noreferrer"
              className="footer-nav-link"
            >
              Instagram
            </a>
          </nav>

          <div className="footer-meta-row">
            <div className="creator-signature">
              Designed &amp; developed by Anuj Rai
            </div>
            <Suspense fallback={null}>
              <VisitorCounter />
            </Suspense>
            {hasEntered && (
              <span className="ambient-indicator">
                {`वर्तमान मूड: ${currentPlaylist?.name || '90s का दौर'}`}
              </span>
            )}
          </div>

          <div className="footer-copyright-row">
            <p className="copyright-text">
              © {new Date().getFullYear()} Kaanch Ke Theke (काँच के ठेके). सर्वाधिकार सुरक्षित।
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App



