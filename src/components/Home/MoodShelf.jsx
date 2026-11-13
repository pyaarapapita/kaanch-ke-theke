import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MOOD_COPY, toDevanagari } from './homeContent'

function EqualizerBars() {
  return (
    <span className="mood-eq" aria-hidden="true">
      <span className="mood-eq-bar" />
      <span className="mood-eq-bar" />
      <span className="mood-eq-bar" />
    </span>
  )
}

/**
 * The playlists as a shelf of tapes. The ones you can play are large; the ones still being
 * recorded are a row of spines beside them, which becomes a swipeable row on phones.
 */
export const MoodShelf = memo(function MoodShelf({ playlists, activePlaylistId, isPlaying, onSelectPlaylist }) {
  const moods = playlists.map((playlist, index) => ({
    id: playlist.id,
    code: `KKT-${toDevanagari(String(index + 1).padStart(2, '0'))}`,
    isUpcoming: Boolean(playlist.isUpcoming),
    songCount: playlist.songs?.length || 0,
    ...(MOOD_COPY[playlist.id] || { title: playlist.name, tagline: '', desc: playlist.description })
  }))
  const ready = moods.filter((mood) => !mood.isUpcoming)
  const upcoming = moods.filter((mood) => mood.isUpcoming)

  return (
    <div className="mood-shelf">
      <ul className="mood-ready-list" role="list">
        {ready.map((mood) => {
          const isActive = mood.id === activePlaylistId
          const isOnAir = isActive && isPlaying
          const playLabel = isOnAir ? 'फिर से बजाएँ' : 'बजाएँ'
          return (
            <li key={mood.id} className={`mood-tape ${isActive ? 'is-active' : ''}`}>
              <div className="mood-tape-top">
                <span className="mood-code">{mood.code}</span>
                <span className="mood-status">
                  {isOnAir && <EqualizerBars />}
                  {isOnAir ? 'बज रही है' : isActive ? 'चुनी हुई' : 'तैयार'}
                </span>
              </div>
              <h3 className="mood-title">{mood.title}</h3>
              <p className="mood-tagline">{mood.tagline}</p>
              <p className="mood-desc">{mood.desc}</p>
              {mood.songCount > 0 && (
                <p className="mood-meta">{toDevanagari(mood.songCount)} नग़मे • साइड ए</p>
              )}
              <div className="mood-actions">
                <button
                  type="button"
                  className="editorial-action-link mood-play-btn"
                  onClick={() => onSelectPlaylist(mood.id)}
                  aria-label={`${playLabel} — ${mood.title}`}
                >
                  {playLabel}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <Link to={`/playlists/${mood.id}`} className="text-link" aria-label={`${mood.title} की ट्रैकलिस्ट देखें`}>
                  ट्रैकलिस्ट देखें →
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      {upcoming.length > 0 && (
        <div className="mood-upcoming">
          <p className="mood-upcoming-label">अगली रिकॉर्डिंग</p>
          <ul className="mood-upcoming-list" role="list">
            {upcoming.map((mood) => (
              <li key={mood.id} className="mood-spine">
                <Link to={`/playlists/${mood.id}`} className="mood-spine-link" aria-label={`${mood.title} — शीघ्र उपलब्ध। विवरण देखें`}>
                  <span className="mood-code">{mood.code}</span>
                  <span className="mood-spine-title">{mood.title}</span>
                  <span className="mood-spine-tagline">{mood.tagline}</span>
                  <span className="mood-spine-chip">शीघ्र</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link to="/playlists" className="text-link mood-all-link">
        सभी प्लेलिस्ट्स देखें →
      </Link>
    </div>
  )
})
