import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYLISTS } from '../data/playlists'

export function PlaylistsModal({ isOpen, onClose, currentPlaylist, onSelectPlaylist, onPlaySong, playlists = PLAYLISTS }) {
  const [activeTabId, setActiveTabId] = useState(() => currentPlaylist?.id || playlists[0]?.id)

  useEffect(() => {
    if (currentPlaylist?.id) {
      setActiveTabId(currentPlaylist.id)
    }
  }, [currentPlaylist?.id])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const selectedPl = playlists.find((p) => p.id === activeTabId) || playlists[0]
  const isCurrentActive = currentPlaylist?.id === selectedPl.id

  return (
    <AnimatePresence>
      <div
        className="modal-backdrop playlist-modal-backdrop"
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          className="modal-dialog playlist-modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="playlist-modal-title"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="playlist-modal-header">
            <div>
              <span className="editorial-badge">THEKA MIXTAPE 🎧</span>
              <h2 id="playlist-modal-title" className="playlist-modal-title">
                Late Night Playlists &amp; Vibes
              </h2>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Playlist Tabs */}
          <div className="playlist-modal-tabs">
            {playlists.map((pl) => {
              const isSelected = pl.id === activeTabId
              const isPlayingThis = currentPlaylist?.id === pl.id
              return (
                <button
                  key={pl.id}
                  type="button"
                  className={`playlist-tab-btn ${isSelected ? 'active' : ''} ${isPlayingThis ? 'is-playing' : ''}`}
                  onClick={() => setActiveTabId(pl.id)}
                >
                  <span>{pl.name}</span>
                  {isPlayingThis && <span className="tab-playing-dot" title="Now Playing" />}
                </button>
              )
            })}
          </div>

          {/* Selected Playlist Content */}
          <div className="playlist-modal-body">
            <div className="playlist-info-card">
              <div className="playlist-info-meta">
                <h3 className="playlist-info-name">{selectedPl.name}</h3>
                <p className="playlist-info-desc">{selectedPl.description}</p>
              </div>
              {!selectedPl.isUpcoming && (
                <button
                  type="button"
                  className="modal-play-all-btn"
                  onClick={() => {
                    const firstSong = selectedPl.songs?.[0]
                    if (firstSong?.youtubeId && onPlaySong) {
                      onPlaySong(firstSong.youtubeId, selectedPl.id)
                    } else if (onSelectPlaylist) {
                      onSelectPlaylist(selectedPl.id)
                    }
                    onClose()
                  }}
                >
                  {isCurrentActive ? 'Vibe Playing 🟢' : 'Vibe Set Karo ▶'}
                </button>
              )}
            </div>

            {/* Tracklist */}
            {selectedPl.isUpcoming ? (
              <div className="upcoming-notice-box">
                <p>⚡ Yeh playlist jaldi aane wali hai. Stay tuned for new retro bangers!</p>
              </div>
            ) : (
              <div className="modal-songs-list">
                <div className="modal-songs-header">
                  <span className="col-header-num">#</span>
                  <span className="col-header-title">Track Name</span>
                  <span className="col-header-artist">Artist</span>
                  <span className="col-header-play">Play</span>
                </div>
                {selectedPl.songs && selectedPl.songs.length > 0 ? (
                  selectedPl.songs.map((song, idx) => (
                    <div key={song.id || idx} className="modal-song-row">
                      <span className="song-idx">{idx + 1}</span>
                      <span className="song-title">{song.title}</span>
                      <span className="song-artist">{song.artist}</span>
                      <button
                        type="button"
                        className="modal-play-song-btn"
                        onClick={() => {
                          if (onPlaySong && song.youtubeId) {
                            onPlaySong(song.youtubeId, selectedPl.id)
                          } else if (onSelectPlaylist) {
                            onSelectPlaylist(selectedPl.id)
                          }
                          onClose()
                        }}
                        aria-label={`${song.title} play`}
                        title={`Play ${song.title}`}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-songs-text">Koi track nahi mila.</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
