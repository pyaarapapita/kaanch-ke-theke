import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getPlaylistById, DEFAULT_PLAYLIST_ID, PLAYLISTS } from './data/playlists'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { YouTubePlayer } from './components/YouTubePlayer'
import { MusicPlayer } from './components/MusicPlayer'
import { MoodSelector } from './components/MoodSelector'
import { HomePageView } from './components/HomePageView'
import { fetchPlaylistMetadata } from './utils/youtubeMetadata'
import './App.css'

// Dynamic lazy imports for non-critical routes and deferred components
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage'))
const PlaylistDetailPage = lazy(() => import('./pages/PlaylistDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PlaylistsModal = lazy(() => import('./components/PlaylistsModal'))
const VisitorCounter = lazy(() => import('./components/VisitorCounter'))

// Configuration for external profile/support links
const SITE_CONFIG = {
  INSTAGRAM_URL: 'https://www.instagram.com/ironically_anujj',
  BUY_ME_A_COFFEE_URL: 'https://buymeacoffee.com/kaanchketheke'
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [hasEntered, setHasEntered] = useState(false)
  const [isVideoTransitioning, setIsVideoTransitioning] = useState(false)
  const [isVideoFinished, setIsVideoFinished] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showPlaylistsModal, setShowPlaylistsModal] = useState(false)
  const [hasOpenedModal, setHasOpenedModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState(() => getPlaylistById(DEFAULT_PLAYLIST_ID) || PLAYLISTS[0])
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [autoSkipMessage, setAutoSkipMessage] = useState(null)

  const aboutBtnRef = useRef(null)
  const closeBtnRef = useRef(null)
  const videoRef = useRef(null)

  const playlistSongs = useMemo(() => currentPlaylist?.songs || [], [currentPlaylist])

  const handleOpenPlaylistsModal = useCallback(() => {
    setHasOpenedModal(true)
    setShowPlaylistsModal(true)
  }, [])

  // Synchronize route URL parameter with active playlist state and handle smooth scroll to top on navigation
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    try {
      window.scrollTo({ top: 0, left: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
    } catch {
      window.scrollTo(0, 0)
    }

    Promise.resolve().then(() => {
      setIsMobileMenuOpen(false)
      if (location.pathname === '/playlists') {
        setHasEntered(true)
        setShowPlaylistsModal(false)
      } else if (location.pathname.startsWith('/playlists/')) {
        setHasEntered(true)
        setShowPlaylistsModal(false)
        const targetId = location.pathname.replace('/playlists/', '').trim()
        if (targetId) {
          const pl = getPlaylistById(targetId)
          if (pl && pl.id !== currentPlaylist?.id) {
            setCurrentPlaylist(pl)
          }
        }
      }
    })
  }, [location.pathname, currentPlaylist?.id])

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

  // Lock scroll when pre-entry or modal is active
  useEffect(() => {
    if (!hasEntered || showAbout) {
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
  }, [hasEntered, showAbout, isMobileMenuOpen])

  // Fetch playlist metadata automatically on mount / playlist change
  useEffect(() => {
    let isMounted = true
    const plId = currentPlaylist?.youtubePlaylistId
    if (plId) {
      Promise.resolve().then(() => {
        if (isMounted) setIsLoadingMetadata(true)
      })
      fetchPlaylistMetadata(plId).then(() => {
        if (isMounted) {
          setIsLoadingMetadata(false)
        }
      }).catch(() => {
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

  const [isSkippingIntro, setIsSkippingIntro] = useState(false)
  const isSkippingRef = useRef(false)

  const handlePlaySong = useCallback((songId, playlistId = null) => {
    setHasEntered(true)
    setShowAbout(false)

    let targetPlaylist = currentPlaylist
    if (playlistId) {
      targetPlaylist = getPlaylistById(playlistId)
      setCurrentPlaylist(targetPlaylist)
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
  }, [currentPlaylist, playlistSongs, playSongId, playPlaylistId])

  const handleSelectPlaylist = useCallback((playlistId) => {
    const selected = getPlaylistById(playlistId)
    setCurrentPlaylist(selected)
    setCurrentSongIndex(0)
    setHasEntered(true)

    const songs = selected?.songs || []
    const targetSong = songs.find((s) => Boolean(s.youtubeId)) || songs[0]
    if (targetSong?.youtubeId) {
      playSongId(targetSong.youtubeId)
    } else if (selected?.youtubePlaylistId) {
      playPlaylistId(selected.youtubePlaylistId)
    }
  }, [playPlaylistId, playSongId])

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

  const handleStartEntryTransition = useCallback(() => {
    if (isVideoTransitioning || isVideoFinished || hasEntered) return
    setIsVideoTransitioning(true)
    setShowAbout(false)
  }, [isVideoTransitioning, isVideoFinished, hasEntered])

  const completeEntryTransition = useCallback(() => {
    if (isVideoFinished || hasEntered) return
    isSkippingRef.current = false
    setIsSkippingIntro(false)
    if (videoRef.current) {
      try { videoRef.current.pause() } catch (e) { console.warn(e) }
    }
    setIsVideoFinished(true)
    setIsVideoTransitioning(false)
    handleEnterTheka()
  }, [isVideoFinished, hasEntered, handleEnterTheka])

  const handleVideoEnded = useCallback(() => {
    const vid = videoRef.current
    if (vid && vid.duration && !isNaN(vid.duration) && vid.duration > 0.1) {
      try {
        vid.pause()
        vid.currentTime = Math.max(0, vid.duration - 0.08)
      } catch (e) {
        console.warn(e)
      }
    }
    completeEntryTransition()
  }, [completeEntryTransition])

  const handleVideoError = useCallback((err) => {
    console.warn('[App] Entry video load error:', err)
    completeEntryTransition()
  }, [completeEntryTransition])

  const handleSkipIntro = useCallback(() => {
    if (isVideoFinished || hasEntered || isSkippingRef.current) return
    isSkippingRef.current = true
    setIsSkippingIntro(true)

    const vid = videoRef.current
    if (vid) {
      const finalize = () => {
        if (!isSkippingRef.current) return
        try { vid.pause() } catch (e) { console.warn(e) }
        completeEntryTransition()
      }

      if (vid.duration && !isNaN(vid.duration) && vid.duration > 0.1) {
        try {
          vid.pause()
          // Seek directly to the end frame showing counter with bottle placed down
          const targetTime = Math.max(0, vid.duration - 0.08)
          vid.currentTime = targetTime
          vid.addEventListener('seeked', finalize, { once: true })
          setTimeout(finalize, 90)
          return
        } catch (err) {
          console.warn('[App] Seek video to end failed on skip:', err)
        }
      } else {
        const onLoadedMeta = () => {
          try {
            vid.pause()
            const targetTime = Math.max(0, (vid.duration || 1) - 0.08)
            vid.currentTime = targetTime
            vid.addEventListener('seeked', finalize, { once: true })
            setTimeout(finalize, 90)
          } catch {
            finalize()
          }
        }
        vid.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
        setTimeout(finalize, 250)
        return
      }
    }

    completeEntryTransition()
  }, [isVideoFinished, hasEntered, completeEntryTransition])

  useEffect(() => {
    if (isVideoTransitioning && videoRef.current) {
      videoRef.current.currentTime = 0
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[App] Video play request failed:', err)
          completeEntryTransition()
        })
      }
    }
  }, [isVideoTransitioning, completeEntryTransition])

  const handleClosePlaylistsModal = useCallback(() => {
    setShowPlaylistsModal(false)
  }, [])

  return (
    <div className={`landing-container ${hasEntered ? 'is-entered' : ''}`}>
      {/* Hidden YouTube IFrame Player Instance */}
      <YouTubePlayer containerRef={containerRef} />

      {/* Background Layer A */}
      {!isVideoFinished && (
        <div className="bg-placeholder" aria-hidden="true">
          <div className="bg-image" />
          <div className="ambient-glow" />
          <div className="overlay-vignette" />
          <div className="film-grain" />
        </div>
      )}

      {/* Background Layer B */}
      {(isVideoTransitioning || isVideoFinished) && (
        <div
          className={`video-entry-overlay ${isVideoTransitioning ? 'playing-overlay' : 'frozen-bg'}`}
          aria-hidden={!isVideoTransitioning}
        >
          <video
            ref={videoRef}
            className="cinematic-entry-video"
            src="/shopkeeper-entry.mp4"
            preload="auto"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            onError={handleVideoError}
          />

          {/* Accessible Skip Intro Button during Video Playback */}
          {isVideoTransitioning && (
            <motion.button
              type="button"
              className={`video-skip-btn ${isSkippingIntro ? 'is-skipping' : ''}`}
              onClick={handleSkipIntro}
              disabled={isSkippingIntro}
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
          {(hasEntered || location.pathname !== '/') && (
            <Link
              to="/playlists"
              className={`nav-link ${location.pathname === '/playlists' ? 'active' : ''}`}
              aria-label="सभी प्लेलिस्ट्स (All Playlists)"
            >
              प्लेलिस्ट्स
            </Link>
          )}

          {hasEntered && (
            <button
              type="button"
              className="nav-link nav-link-btn"
              onClick={handleOpenPlaylistsModal}
              aria-label="प्लेलिस्ट डायलॉग (Quick Switch Modal)"
            >
              मूड स्विच 📻
            </button>
          )}

          <div className="support-nav-item">
            <a
              href={SITE_CONFIG.BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-support-btn"
              aria-label="मेरी अगली बोतल के लिए (Support Creator)"
            >
              मेरी अगली बोतल के लिए 🍾
            </a>
          </div>

          {hasEntered && (
            <MoodSelector
              playlists={PLAYLISTS}
              activePlaylistId={currentPlaylist?.id}
              onSelectPlaylist={handleSelectPlaylist}
            />
          )}

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
                  {(hasEntered || location.pathname !== '/') && (
                    <Link
                      to="/playlists"
                      className="mobile-nav-card-btn"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="mobile-card-icon">📻</span>
                      <div className="mobile-card-text">
                        <span className="mobile-card-title">सभी प्लेलिस्ट्स</span>
                        <span className="mobile-card-sub">5 चुनिंदा महफ़िलें</span>
                      </div>
                    </Link>
                  )}

                  {hasEntered && (
                    <button
                      type="button"
                      className="mobile-nav-card-btn"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleOpenPlaylistsModal()
                      }}
                    >
                      <span className="mobile-card-icon">🎛️</span>
                      <div className="mobile-card-text">
                        <span className="mobile-card-title">मूड बदलें</span>
                        <span className="mobile-card-sub">क्विक प्लेलिस्ट डायलॉग</span>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    className="mobile-nav-card-btn"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setShowAbout(true)
                    }}
                  >
                    <span className="mobile-card-icon">📜</span>
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
                  <span>मेरी अगली बोतल के लिए 🍾</span>
                  <span className="mobile-support-sub">Support Creator</span>
                </a>

                {/* Integrated Mobile Mood Selector */}
                {hasEntered && (
                  <div className="mobile-mood-wrapper">
                    <div className="mobile-mood-header">
                      <span className="mobile-mood-title">मूड चुनिए (Mood Selector)</span>
                    </div>
                    <div className="mobile-mood-list">
                      {PLAYLISTS.map((pl) => {
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
      <Suspense fallback={<div className="route-loading-fallback" aria-hidden="true" />}>
        <Routes>
        <Route
          path="/"
          element={
            <HomePageView
              hasEntered={hasEntered}
              isVideoTransitioning={isVideoTransitioning}
              currentPlaylist={currentPlaylist}
              playlistSongs={playlistSongs}
              currentSongIndex={currentSongIndex}
              currentSong={currentSong}
              isPlaying={isPlaying}
              handleStartEntryTransition={handleStartEntryTransition}
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
              onSelectPlaylist={handleSelectPlaylist}
            />
          }
        />

        <Route
          path="/playlists/:id"
          element={
            <PlaylistDetailPage
              currentPlaylist={currentPlaylist}
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

      {/* Playlists Dialog Box Modal */}
      {hasOpenedModal && (
        <Suspense fallback={null}>
          <PlaylistsModal
            isOpen={showPlaylistsModal}
            onClose={handleClosePlaylistsModal}
            currentPlaylist={currentPlaylist}
            onSelectPlaylist={handleSelectPlaylist}
            onPlaySong={handlePlaySong}
          />
        </Suspense>
      )}

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
              प्लेलिस्ट्स (Playlists)
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
              सहयोग करें 🍾
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
              Designed &amp; Developed with 🌿 by Anuj Rai
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



