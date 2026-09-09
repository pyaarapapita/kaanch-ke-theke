import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getPlaylistById, DEFAULT_PLAYLIST_ID, PLAYLISTS } from './data/playlists'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { YouTubePlayer } from './components/YouTubePlayer'
import { MusicPlayer } from './components/MusicPlayer'
import { MoodSelector } from './components/MoodSelector'
import { fetchPlaylistMetadata } from './utils/youtubeMetadata'
import './App.css'

function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState(() => getPlaylistById(DEFAULT_PLAYLIST_ID))
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [fetchedMetadata, setFetchedMetadata] = useState({})

  const isPlaylistMode = Boolean(currentPlaylist?.youtubePlaylistId)
  const playlistSongs = currentPlaylist?.songs || []

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
      // In playlist mode, YouTube automatically advances natively.
      // Do NOT trigger manual advance to prevent double skipping.
      if (!isPlaylistMode) {
        handleNextSong()
      }
    },
    onError: (err) => {
      console.warn('[App] Playback error notice:', err)
    }
  })

  // Resolve currentSong dynamically
  let currentSong = null
  if (isPlaylistMode) {
    if (currentVideoId) {
      if (fetchedMetadata[currentVideoId]) {
        currentSong = fetchedMetadata[currentVideoId]
      } else {
        const matchedSong = playlistSongs.find((s) => s.youtubeId === currentVideoId)
        if (matchedSong) {
          currentSong = matchedSong
        } else {
          currentSong = {
            id: `yt-${currentVideoId}`,
            title: 'अज्ञात गीत',
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

  return (
    <div className="landing-container">
      {/* Hidden YouTube IFrame Player Instance */}
      <YouTubePlayer containerRef={containerRef} />

      {/* Background Layer: Atmospheric background image with cinematic gradient & vignette overlay */}
      <div className="bg-placeholder" aria-hidden="true">
        <div className="bg-image" />
        <div className="ambient-glow" />
        <div className="overlay-vignette" />
        <div className="film-grain" />
      </div>

      {/* Minimal Header */}
      <header className="header">
        <div className="brand">
          <span className="brand-title-hindi">काँच के ठेके</span>
          <span className="brand-title-english">KAANCH KE THEKE</span>
        </div>
        <nav className="nav-links">
          <MoodSelector
            playlists={PLAYLISTS}
            activePlaylistId={currentPlaylist?.id}
            onSelectPlaylist={handleSelectPlaylist}
          />
          <a href="#about" className="nav-link" onClick={(e) => e.preventDefault()}>बारे में</a>
        </nav>
      </header>

      {/* Hero Content */}
      <main className="hero">
        <div className="hero-content">
          <div className="title-wrapper">
            <motion.p 
              className="hero-opening-quote"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.65, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              अपने किरदार से महकता है इंसान , चरित्र पवित्र करने का इत्र नहीं आता
            </motion.p>
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
            आज कुछ पुराना सुनते हैं...
          </motion.p>

          <div className="cta-wrapper">
            <AnimatePresence mode="wait">
              {!hasEntered && (
                <motion.button
                  type="button"
                  className="cta-button"
                  onClick={handleEnterTheka}
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
      </main>

      {/* Custom Floating Music Player (Appears upon entrance) */}
      <AnimatePresence>
        {hasEntered && (
          <MusicPlayer
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
          />
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



