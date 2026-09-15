import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getPlaylistById, DEFAULT_PLAYLIST_ID, PLAYLISTS } from './data/playlists'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { YouTubePlayer } from './components/YouTubePlayer'
import { MusicPlayer } from './components/MusicPlayer'
import { MoodSelector } from './components/MoodSelector'
import { fetchPlaylistMetadata, fetchSingleVideoMetadata } from './utils/youtubeMetadata'
import './App.css'

// Configuration for external profile/support links
const SITE_CONFIG = {
  INSTAGRAM_URL: 'https://www.instagram.com/ironically_anujj',
  BUY_ME_A_COFFEE_URL: 'https://buymeacoffee.com/kaanchketheke'
}

function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [isVideoTransitioning, setIsVideoTransitioning] = useState(false)
  const [isVideoFinished, setIsVideoFinished] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState(() => getPlaylistById(DEFAULT_PLAYLIST_ID))
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [fetchedMetadata, setFetchedMetadata] = useState({})

  const aboutBtnRef = useRef(null)
  const closeBtnRef = useRef(null)
  const videoRef = useRef(null)

  const isPlaylistMode = Boolean(currentPlaylist?.youtubePlaylistId)
  const playlistSongs = currentPlaylist?.songs || []

  // Scroll position tracking to control complete header panel & MusicPlayer visibility
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
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? 'auto' : 'smooth'
    })
  }, [])

  // Prevent main page scrolling until user clicks "ठेके में प्रवेश करें" & handle modal scroll-locking
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
      fetchPlaylistMetadata(plId).then((metadataMap) => {
        if (isMounted && metadataMap && Object.keys(metadataMap).length > 0) {
          setFetchedMetadata(metadataMap)
        }
      })
    }
    return () => {
      isMounted = false
    }
  }, [currentPlaylist?.youtubePlaylistId])

  const {
    containerRef,
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
    setVolume
  } = useYouTubePlayer({
    youtubeId: !isPlaylistMode ? (playlistSongs[currentSongIndex]?.youtubeId || '') : '',
    playlistId: isPlaylistMode ? (currentPlaylist.youtubePlaylistId || '') : '',
    onSongEnd: () => {
      if (!isPlaylistMode) {
        handleNextSong()
      }
    },
    onError: (err) => {
      console.warn('[App] Playback error notice:', err)
    }
  })

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

  // Fetch single video metadata fallback via oEmbed when currentVideoId is missing in fetchedMetadata
  useEffect(() => {
    let isMounted = true
    if (currentVideoId && !fetchedMetadata[currentVideoId]) {
      fetchSingleVideoMetadata(currentVideoId).then((meta) => {
        if (isMounted && meta && meta.title) {
          setFetchedMetadata((prev) => (prev[currentVideoId] ? prev : { ...prev, [currentVideoId]: meta }))
        }
      })
    }
    return () => {
      isMounted = false
    }
  }, [currentVideoId])

  // Resolve currentSong dynamically with multiple title fallback layers
  let currentSong = null
  if (isPlaylistMode) {
    if (currentVideoId) {
      if (fetchedMetadata[currentVideoId]) {
        currentSong = fetchedMetadata[currentVideoId]
      } else {
        const matchedSong = playlistSongs.find((s) => s.youtubeId === currentVideoId)
        if (matchedSong && matchedSong.title) {
          currentSong = matchedSong
        } else if (videoTitle) {
          currentSong = {
            id: `yt-${currentVideoId}`,
            title: videoTitle,
            artist: videoAuthor || 'YouTube',
            youtubeId: currentVideoId
          }
        } else {
          currentSong = {
            id: `yt-${currentVideoId}`,
            title: 'काँच के ठेके',
            artist: 'YouTube',
            youtubeId: currentVideoId
          }
        }
      }
    } else {
      currentSong = playlistSongs[0] || null
    }
  } else {
    currentSong = playlistSongs[currentSongIndex] || null
  }

  const handleNextSong = useCallback(() => {
    if (isPlaylistMode) {
      console.log('[App] handleNextSong calling native nextVideo() for playlist mode')
      nextVideo()
    } else {
      if (!playlistSongs.length) return
      const nextIndex = (currentSongIndex + 1) % playlistSongs.length
      setCurrentSongIndex(nextIndex)
      const nextSong = playlistSongs[nextIndex]
      if (nextSong?.youtubeId) {
        console.log('[App] handleNextSong triggering playSongId:', nextSong.title, nextSong.youtubeId)
        playSongId(nextSong.youtubeId)
      }
    }
  }, [isPlaylistMode, nextVideo, playlistSongs, currentSongIndex, playSongId])

  const handlePreviousSong = useCallback(() => {
    if (isPlaylistMode) {
      console.log('[App] handlePreviousSong calling native previousVideo() for playlist mode')
      previousVideo()
    } else {
      if (!playlistSongs.length) return
      const prevIndex = (currentSongIndex - 1 + playlistSongs.length) % playlistSongs.length
      setCurrentSongIndex(prevIndex)
      const prevSong = playlistSongs[prevIndex]
      if (prevSong?.youtubeId) {
        console.log('[App] handlePreviousSong triggering playSongId:', prevSong.title, prevSong.youtubeId)
        playSongId(prevSong.youtubeId)
      }
    }
  }, [isPlaylistMode, previousVideo, playlistSongs, currentSongIndex, playSongId])

  const handleSelectPlaylist = useCallback((playlistId) => {
    const selected = getPlaylistById(playlistId)
    setCurrentPlaylist(selected)
    setCurrentSongIndex(0)

    if (hasEntered) {
      if (selected?.youtubePlaylistId) {
        console.log('[App] handleSelectPlaylist playing playlist:', selected.name, selected.youtubePlaylistId)
        playPlaylistId(selected.youtubePlaylistId)
      } else {
        const songs = selected?.songs || []
        const firstPlayableIndex = songs.findIndex((s) => Boolean(s.youtubeId))
        const targetIndex = firstPlayableIndex !== -1 ? firstPlayableIndex : 0
        setCurrentSongIndex(targetIndex)
        const targetSong = songs[targetIndex]
        if (targetSong?.youtubeId) {
          console.log('[App] handleSelectPlaylist playing song:', targetSong.title, targetSong.youtubeId)
          playSongId(targetSong.youtubeId)
        }
      }
    }
  }, [hasEntered, playPlaylistId, playSongId])

  const handleEnterTheka = useCallback(() => {
    setHasEntered(true)
    setShowAbout(false)

    if (currentPlaylist?.youtubePlaylistId) {
      console.log('[App] handleEnterTheka playing playlist:', currentPlaylist.name, currentPlaylist.youtubePlaylistId)
      playPlaylistId(currentPlaylist.youtubePlaylistId)
    } else {
      let targetIndex = currentSongIndex
      let targetSong = playlistSongs[targetIndex]

      if (!targetSong?.youtubeId) {
        const firstPlayableIndex = playlistSongs.findIndex((s) => Boolean(s.youtubeId))
        if (firstPlayableIndex !== -1) {
          targetIndex = firstPlayableIndex
          targetSong = playlistSongs[firstPlayableIndex]
          setCurrentSongIndex(firstPlayableIndex)
        }
      }

      if (targetSong?.youtubeId) {
        console.log('[App] handleEnterTheka triggering playSongId:', targetSong.title, targetSong.youtubeId)
        playSongId(targetSong.youtubeId)
      } else {
        console.log('[App] handleEnterTheka: No song with valid youtubeId in playlist.')
      }
    }
  }, [currentPlaylist, playPlaylistId, currentSongIndex, playlistSongs, playSongId])

  const handleStartEntryTransition = useCallback(() => {
    if (isVideoTransitioning || isVideoFinished || hasEntered) return
    setIsVideoTransitioning(true)
    setShowAbout(false)
  }, [isVideoTransitioning, isVideoFinished, hasEntered])

  const handleVideoEnded = useCallback(() => {
    if (videoRef.current) {
      try {
        videoRef.current.pause()
      } catch (e) {
        console.warn('[App] Error pausing video at end:', e)
      }
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

  return (
    <div className={`landing-container ${hasEntered ? 'is-entered' : ''}`}>
      {/* Hidden YouTube IFrame Player Instance */}
      <YouTubePlayer containerRef={containerRef} />

      {/* Background Layer A: Static background image shown before button click */}
      {!isVideoTransitioning && !isVideoFinished && (
        <div className="bg-placeholder" aria-hidden="true">
          <div className="bg-image" />
          <div className="ambient-glow" />
          <div className="overlay-vignette" />
          <div className="film-grain" />
        </div>
      )}

      {/* Background Layer B: Full-screen video transition overlay that freezes on final frame as background */}
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

      {/* Header with Fixed Position & Top-Right Navigation Controls */}
      <header className={`header ${isScrolled ? 'is-scrolled' : ''}`}>
        <button
          type="button"
          className="brand brand-btn"
          onClick={handleLogoClick}
          aria-label="काँच के ठेके — ऊपर जाएँ"
        >
          <span className="brand-title-hindi">काँच के ठेके</span>
          <span className="brand-title-english">KAANCH KE THEKE</span>
        </button>
        <nav className="nav-links">
          {/* Control 1: Support Button */}
          <div className="support-nav-item">
            {SITE_CONFIG.BUY_ME_A_COFFEE_URL ? (
              <a
                href={SITE_CONFIG.BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-support-btn"
                aria-label="मेरी अगली बोतल के लिए (Support Creator)"
              >
                मेरी अगली बोतल के लिए 🍾
              </a>
            ) : (
              <button
                type="button"
                className="nav-support-btn disabled-nav-support"
                disabled
                aria-disabled="true"
                aria-label="मेरी अगली बोतल के लिए (Support Creator)"
              >
                मेरी अगली बोतल के लिए 🍾
              </button>
            )}
          </div>

          {/* Control 2: Mood Selector */}
          <MoodSelector
            playlists={PLAYLISTS}
            activePlaylistId={currentPlaylist?.id}
            onSelectPlaylist={handleSelectPlaylist}
          />

          {/* Control 3: Baare Mein Link */}
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
      </header>

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
              KAANCH KE THEKE
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
              {!hasEntered && (
                <motion.button
                  type="button"
                  className="cta-button"
                  onClick={handleStartEntryTransition}
                  disabled={isVideoTransitioning}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.4 }}
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

      {/* Extended Editorial Content Flow & Playlist Overview (DOM Accessible for SEO & Crawlers) */}
      <motion.div
        className={`post-entry-editorial-flow ${hasEntered ? 'is-entered-visible' : 'initial-hidden-seo'}`}
        initial={false}
        animate={{ opacity: hasEntered ? 1 : 0.85, y: hasEntered ? 0 : 20 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* Section 1: About the Site */}
        <section className="editorial-section story-section" aria-label="काँच के ठेके की कहानी">
          <div className="editorial-container">
            <div className="editorial-visual-panel">
              <img
                src="/backgrounds/editorial-story.png"
                alt="काँच के ठेके की महफ़िल - पुराने गिलास, लालटेन और विनाइल रिकॉर्ड"
                className="editorial-img"
                loading="lazy"
                width="520"
                height="390"
              />
              <div className="visual-overlay-vignette" />
            </div>

            <div className="editorial-content-panel">
              <div className="editorial-badge-row">
                <span className="editorial-badge">THE STORY BEHIND THE THEKA</span>
                <span className="editorial-meta">A PERSONAL CREATIVE PROJECT</span>
              </div>
              <h2 className="editorial-title">एक छोटी-सी महफ़िल, कुछ पुरानी धुनें</h2>
              <p className="editorial-desc">
                काँच के ठेके एक छोटी-सी डिजिटल महफ़िल है—पुराने हिंदी गीतों, बीती शामों और उन यादों के नाम जो किसी धुन के साथ वापस लौट आती हैं। इसे इस एहसास के लिए बनाया गया है कि कभी-कभी एक गाना, एक ख़ामोश रात और थोड़ी-सी तन्हाई ही काफ़ी होती है।
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

        {/* Section 2: Playlists Overview for Search Engines & Visitors */}
        <section className="editorial-section playlists-section" aria-label="चुनिंदा हिंदी म्यूज़िक प्लेलिस्ट्स">
          <div className="editorial-container">
            <div className="editorial-content-panel full-width-panel">
              <div className="editorial-badge-row">
                <span className="editorial-badge">CURATED PLAYLISTS</span>
                <span className="editorial-meta">RETRO BOLLYWOOD MUSIC</span>
              </div>
              <h2 className="editorial-title">चुनिंदा बॉलीवुड प्लेलिस्ट्स (Curated Playlists)</h2>
              <div className="playlists-editorial-grid">
                {PLAYLISTS.map((pl) => {
                  const isCurrent = currentPlaylist?.id === pl.id
                  const isUpcoming = Boolean(pl.isUpcoming)
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      className={`playlist-card-item ${isCurrent ? 'active-card' : ''} ${isUpcoming ? 'upcoming-card' : ''}`}
                      onClick={() => !isUpcoming && handleSelectPlaylist(pl.id)}
                      aria-current={isCurrent ? 'true' : undefined}
                      disabled={isUpcoming}
                    >
                      <div className="playlist-card-header">
                        <h3 className="playlist-card-title">{pl.name}</h3>
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
                      <span className="playlist-card-meta">
                        {isUpcoming ? 'शीघ्र उपलब्ध • Upcoming' : `${pl.songs?.length || 0} चुनिंदा गीत`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Instagram & Community */}
        <section className="editorial-section instagram-section" aria-label="इन्स्टाग्राम से जुड़ें">
          <div className="editorial-container reverse-container">
            <div className="editorial-content-panel">
              <div className="editorial-badge-row">
                <span className="editorial-badge">BEYOND THE PLAYLIST</span>
                <span className="editorial-meta">FIND THE CREATOR ELSEWHERE</span>
              </div>
              <h2 className="editorial-title">महफ़िल स्क्रीन से बाहर भी जारी है</h2>
              <p className="editorial-desc">
                अगर इस छोटी-सी महफ़िल ने आपको कुछ देर ठहरने पर मजबूर किया, तो Instagram पर भी मिलिए। वहाँ इस प्रोजेक्ट के पीछे की सोच, छोटे creative experiments, updates और आने वाली नई चीज़ों की झलक मिलेगी।
              </p>
              {SITE_CONFIG.INSTAGRAM_URL ? (
                <a
                  href={SITE_CONFIG.INSTAGRAM_URL}
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="editorial-action-link instagram-link"
                >
                  Instagram पर मिलें →
                </a>
              ) : (
                <button
                  type="button"
                  className="editorial-action-link disabled-link"
                  disabled
                  aria-disabled="true"
                >
                  Instagram (शीघ्र उपलब्ध)
                </button>
              )}
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

      {/* Custom Floating Music Player (Persistent DOM container with visual transition) */}
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
      />

      {/* Accessible "Baare Mein" Dialog Modal */}
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



