import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getPlaylistById, DEFAULT_PLAYLIST_ID, PLAYLISTS } from './data/playlists'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { YouTubePlayer } from './components/YouTubePlayer'
import { MusicPlayer } from './components/MusicPlayer'
import { MoodSelector } from './components/MoodSelector'
import { fetchPlaylistMetadata } from './utils/youtubeMetadata'
import { VisitorCounter } from './components/VisitorCounter'
import { PlaylistsPage } from './pages/PlaylistsPage'
import { PlaylistDetailPage } from './pages/PlaylistDetailPage'
import { PlaylistsModal } from './components/PlaylistsModal'
import './App.css'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState(() => getPlaylistById(DEFAULT_PLAYLIST_ID))
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [fetchedMetadata, setFetchedMetadata] = useState({})
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [autoSkipMessage, setAutoSkipMessage] = useState(null)

  const aboutBtnRef = useRef(null)
  const closeBtnRef = useRef(null)
  const videoRef = useRef(null)

  const isPlaylistMode = Boolean(currentPlaylist?.youtubePlaylistId)
  const playlistSongs = useMemo(() => currentPlaylist?.songs || [], [currentPlaylist])

  // Synchronize route URL parameter with active playlist state and handle smooth scroll to top on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    try {
      window.scrollTo({ top: 0, left: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
    } catch {
      window.scrollTo(0, 0)
    }

    if (location.pathname === '/playlists') {
      setHasEntered(true)
      setShowPlaylistsModal(true)
    } else if (location.pathname.startsWith('/playlists/')) {
      setHasEntered(true)
      setShowPlaylistsModal(true)
      const targetId = location.pathname.replace('/playlists/', '').trim()
      if (targetId) {
        const pl = getPlaylistById(targetId)
        if (pl && pl.id !== currentPlaylist?.id) {
          setCurrentPlaylist(pl)
        }
      }
    }
  }, [location.pathname, currentPlaylist?.id])

  // Scroll position tracking to control header panel & MusicPlayer visibility
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || window.pageYOffset || 0
          setIsScrolled(scrollTop > 20)
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      document.removeEventListener('scroll', handleScroll, { capture: true })
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
        if (e.key === 'Escape' && showAbout) {
          setShowAbout(false)
        }
      }
      window.addEventListener('keydown', handleKeyDown)

      return () => {
        clearTimeout(focusTimer)
        document.body.style.overflow = originalOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [hasEntered, showAbout])

  // Fetch playlist metadata automatically on mount / playlist change
  useEffect(() => {
    let isMounted = true
    const plId = currentPlaylist?.youtubePlaylistId
    if (plId) {
      setIsLoadingMetadata(true)
      fetchPlaylistMetadata(plId).then((metadataMap) => {
        if (isMounted) {
          setIsLoadingMetadata(false)
          if (metadataMap && Object.keys(metadataMap).length > 0) {
            setFetchedMetadata(metadataMap)
          }
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
    currentVideoId,
    videoTitle,
    videoAuthor,
    error,
    playSongId,
    playPlaylistId,
    nextVideo,
    previousVideo,
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

  // Resolve currentSong dynamically
  const currentSong = playlistSongs[currentSongIndex] || {
    id: 'default-song',
    title: 'काँच के ठेके',
    artist: 'आज कुछ पुराना सुनते हैं',
    youtubeId: 'Ax5jPATJM1A'
  }

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

  const handleVideoEnded = useCallback(() => {
    if (videoRef.current) {
      try { videoRef.current.pause() } catch (e) { console.warn(e) }
    }
    setIsVideoFinished(true)
    setIsVideoTransitioning(false)
    handleEnterTheka()
  }, [handleEnterTheka])

  const handleVideoError = useCallback((err) => {
    console.warn('[App] Entry video load error:', err)
    setIsVideoFinished(true)
    setIsVideoTransitioning(false)
    handleEnterTheka()
  }, [handleEnterTheka])

  useEffect(() => {
    if (isVideoTransitioning && videoRef.current) {
      videoRef.current.currentTime = 0
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[App] Video play request failed:', err)
          setIsVideoFinished(true)
          setIsVideoTransitioning(false)
          handleEnterTheka()
        })
      }
    }
  }, [isVideoTransitioning, handleEnterTheka])

  const handleClosePlaylistsModal = useCallback(() => {
    setShowPlaylistsModal(false)
    if (location.pathname.startsWith('/playlists')) {
      navigate('/')
    }
  }, [location.pathname, navigate])

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
          aria-hidden="true"
        >
          <video
            ref={videoRef}
            className="cinematic-entry-video"
            src="/shopkeeper-entry.mp4"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            onError={handleVideoError}
          />
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
          {hasEntered && (
            <button
              type="button"
              className="nav-link nav-link-btn"
              onClick={() => setShowPlaylistsModal(true)}
              aria-label="प्लेलिस्ट्स (Playlists Modal)"
            >
              प्लेलिस्ट्स
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
                <div className="mobile-brand-title">
                  <span className="brand-title-hindi">काँच के ठेके</span>
                  <span className="mobile-brand-tagline">रेट्रो संगीत &amp; महफ़िल</span>
                </div>
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
                  {hasEntered && (
                    <button
                      type="button"
                      className="mobile-nav-card-btn"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setShowPlaylistsModal(true)
                      }}
                    >
                      <span className="mobile-card-icon">📻</span>
                      <div className="mobile-card-text">
                        <span className="mobile-card-title">प्लेलिस्ट्स</span>
                        <span className="mobile-card-sub">सभी ५ चुनिंदा प्लेलिस्ट्स</span>
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
      <Routes>
        <Route
          path="/"
          element={
            <>
              {/* Hero Section */}
              <section className={`hero ${hasEntered ? 'is-entered' : ''}`}>
                <div className={`hero-content ${hasEntered ? 'receded' : ''}`}>
                  <div className="title-wrapper">
                    <motion.h1
                      className="main-title"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.4 }}
                    >
                      काँच के ठेके
                    </motion.h1>
                    <motion.p
                      className="subtitle-english"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.95 }}
                      transition={{ duration: 1.2, delay: 0.6 }}
                    >
                      KAANCH KE THEKE — Retro Bollywood Music &amp; Nostalgic Melodies
                    </motion.p>
                  </div>

                  <motion.p
                    className="tagline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.8 }}
                  >
                    अपने किरदार से महकता है इंसान , चरित्र पवित्र करने का इत्र नहीं आता
                  </motion.p>

                  <div className="cta-wrapper">
                    <AnimatePresence mode="wait">
                      {!hasEntered && !isVideoTransitioning && (
                        <motion.button
                          type="button"
                          className="cta-button"
                          onClick={handleStartEntryTransition}
                          disabled={isVideoTransitioning}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.35 }}
                        >
                          ठेके में प्रवेश करें
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {hasEntered && !currentSong?.youtubeId && !currentPlaylist?.youtubePlaylistId && (
                      <span className="ambient-status-note">संगीत सूची तैयार की जा रही है...</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Extended Editorial Content Flow & Playlist Overview */}
              <motion.div
                className={`post-entry-editorial-flow ${hasEntered ? 'is-entered-visible' : 'initial-hidden-seo'}`}
                initial={false}
                animate={{ opacity: hasEntered ? 1 : 0.85, y: hasEntered ? 0 : 20 }}
                transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Section 1: About the Site */}
                <section className="editorial-section story-section" aria-label="काँच के ठेके के बारे में">
                  <div className="editorial-container">
                    <div className="editorial-visual-panel">
                      <img
                        src="/backgrounds/editorial-story.png"
                        alt="पुराने विनाइल रिकॉर्ड और क्लासिक हिंदी संगीत का माहौल"
                        className="editorial-img"
                        loading="lazy"
                        width="520"
                        height="390"
                      />
                      <div className="visual-overlay-vignette" />
                    </div>

                    <div className="editorial-content-panel">
                      <div className="editorial-badge-row">
                        <span className="editorial-badge">The Story Behind The Theka</span>
                        <span className="editorial-meta">A Personal Music Experience</span>
                      </div>
                      <h2 className="editorial-title">एक डिजिटल महफ़िल, 90s के सदाबहार नग़मे और रेट्रो हिंदी संगीत</h2>
                      <p className="editorial-desc">
                        काँच के ठेके (Kaanch Ke Theke) एक अनोखा ऑनलाइन संगीत अनुभव है—पुराने बॉलीवुड गीतों, 90 के दौर के सदाबहार नग़मों, ग़ज़लों और बीती यादों के नाम। यहाँ हर प्लेलिस्ट एक ख़ास मूड और शाम के सुकून को ध्यान में रखकर तैयार की गई है, ताकि आप बिना किसी झंझट के बेहतरीन हिंदी क्लासिक्स का आनंद ले सकें।
                      </p>
                      <button
                        type="button"
                        className="editorial-action-link"
                        onClick={() => setShowAbout(true)}
                      >
                        कहानी पढ़ें →
                      </button>
                    </div>
                  </div>
                </section>

                {/* Section 2: Playlists Overview */}
                <section className="editorial-section playlists-section" aria-label="चुनिंदा हिंदी म्यूज़िक प्लेलिस्ट्स">
                  <div className="editorial-container">
                    <div className="editorial-content-panel full-width-panel">
                      <div className="editorial-badge-row">
                        <span className="editorial-badge">Curated Playlists</span>
                        <span className="editorial-meta">Retro Bollywood &amp; Hindi Classics</span>
                      </div>
                      <h2 className="editorial-title">चुनिंदा रेट्रो बॉलीवुड प्लेलिस्ट्स (Curated Hindi Playlists)</h2>
                      <div className="playlists-editorial-grid">
                        {PLAYLISTS.map((pl) => {
                          const isCurrent = currentPlaylist?.id === pl.id
                          const isUpcoming = Boolean(pl.isUpcoming)
                          return (
                            <div
                              key={pl.id}
                              className={`playlist-card-item ${isCurrent ? 'active-card' : ''} ${isUpcoming ? 'upcoming-card' : ''}`}
                            >
                              <div className="playlist-card-header">
                                <h3 className="playlist-card-title">
                                  <Link to={`/playlists/${pl.id}`} className="playlist-title-link">
                                    {pl.name}
                                  </Link>
                                </h3>
                                {isCurrent && (
                                  <span className="active-equalizer-badge" title="सक्रिय प्लेलिस्ट">
                                    <span className="eq-bar bar-1" />
                                    <span className="eq-bar bar-2" />
                                    <span className="eq-bar bar-3" />
                                    <span className="active-badge-text">सक्रिय</span>
                                  </span>
                                )}
                                {isUpcoming && (
                                  <span className="upcoming-badge" title="शीघ्र उपलब्ध">
                                    शीघ्र उपलब्ध
                                  </span>
                                )}
                              </div>
                              <p className="playlist-card-desc">{pl.description}</p>
                              <div className="playlist-card-footer-row">
                                <span className="playlist-card-meta">
                                  {isUpcoming ? 'शीघ्र उपलब्ध • Upcoming' : `${pl.songs?.length || 0} चुनिंदा गीत`}
                                </span>
                                <div className="playlist-card-actions">
                                  <Link to={`/playlists/${pl.id}`} className="card-action-btn view-btn">
                                    विवरण →
                                  </Link>
                                  {!isUpcoming && (
                                    <button
                                      type="button"
                                      className="card-action-btn play-btn"
                                      onClick={() => handleSelectPlaylist(pl.id)}
                                    >
                                      बजाएं ▶
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 3: Instagram & Community */}
                <section className="editorial-section instagram-section" aria-label="इन्स्टाग्राम और कम्युनिटी से जुड़ें">
                  <div className="editorial-container reverse-container">
                    <div className="editorial-content-panel">
                      <div className="editorial-badge-row">
                        <span className="editorial-badge">Beyond The Playlist</span>
                        <span className="editorial-meta">Find The Creator Elsewhere</span>
                      </div>
                      <h2 className="editorial-title">महफ़िल स्क्रीन से बाहर भी जारी है</h2>
                      <p className="editorial-desc">
                        अगर इस छोटी-सी महफ़िल ने आपको कुछ देर ठहरने पर मजबूर किया, तो Instagram पर भी मिलिए। वहाँ इस प्रोजेक्ट के पीछे की सोच, छोटे creative experiments, updates और आने वाली नई चीज़ों की झलक मिलेगी।
                      </p>
                      <a
                        href={SITE_CONFIG.INSTAGRAM_URL}
                        target="_blank"
                        rel="me noopener noreferrer"
                        className="editorial-action-link instagram-link"
                      >
                        Instagram पर मिलें →
                      </a>
                    </div>

                    <div className="editorial-visual-panel">
                      <img
                        src="/backgrounds/editorial-instagram.png"
                        alt="रेट्रो कैसेट प्लेयर, कैमरा और शाम का सुकून"
                        className="editorial-img"
                        loading="lazy"
                        width="520"
                        height="390"
                      />
                      <div className="visual-overlay-vignette" />
                    </div>
                  </div>
                </section>
              </motion.div>
            </>
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
          element={
            <PlaylistsPage
              currentPlaylist={currentPlaylist}
              onSelectPlaylist={handleSelectPlaylist}
            />
          }
        />
      </Routes>

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
      <PlaylistsModal
        isOpen={showPlaylistsModal}
        onClose={handleClosePlaylistsModal}
        currentPlaylist={currentPlaylist}
        onSelectPlaylist={handleSelectPlaylist}
        onPlaySong={handlePlaySong}
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
        <div className="creator-signature">
          Created with 🌿 by Anuj Rai
        </div>
        <VisitorCounter />
        {hasEntered && (
          <span className="ambient-indicator">
            {`वर्तमान मूड: ${currentPlaylist?.name || '९० का दौर'}`}
          </span>
        )}
      </footer>
    </div>
  )
}

export default App



