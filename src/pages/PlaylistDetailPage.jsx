import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPlaylistById } from '../data/playlists'

export function PlaylistDetailPage({ currentPlaylist, onSelectPlaylist, onPlaySong }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const playlist = getPlaylistById(id)
  const [copyFeedback, setCopyFeedback] = useState(null)

  const handleShare = async () => {
    try {
      if (navigator.clipboard && window.location.href) {
        await navigator.clipboard.writeText(window.location.href)
        setCopyFeedback({ type: 'success', message: '✓ प्लेलिस्ट का लिंक कॉपी हो गया!' })
      } else {
        setCopyFeedback({ type: 'error', message: 'लिंक कॉपी नहीं हो सका। कृपया URL मैन्युअली कॉपी करें।' })
      }
    } catch {
      setCopyFeedback({ type: 'error', message: 'क्लिपबोर्ड एक्सेस की अनुमति नहीं मिली।' })
    }
    setTimeout(() => setCopyFeedback(null), 3500)
  }

  useEffect(() => {
    let metaDesc = document.querySelector('meta[name="description"]')
    let canonical = document.querySelector('link[rel="canonical"]')
    let ogTitle = document.querySelector('meta[property="og:title"]')
    let ogDesc = document.querySelector('meta[property="og:description"]')
    let ogUrl = document.querySelector('meta[property="og:url"]')
    let twTitle = document.querySelector('meta[name="twitter:title"]')
    let twDesc = document.querySelector('meta[name="twitter:description"]')
    let twUrl = document.querySelector('meta[name="twitter:url"]')

    if (playlist) {
      const pageTitle = `${playlist.name} | Kaanch Ke Theke — Playlist`
      const pageDesc = `${playlist.name} — ${playlist.description} काँच के ठेके पर पुराने हिंदी गानों का आनंद लें।`
      const pageUrl = `https://kaanch-ke-theke.pages.dev/playlists/${playlist.id}`

      document.title = pageTitle
      if (metaDesc) metaDesc.setAttribute('content', pageDesc)
      if (canonical) canonical.setAttribute('href', pageUrl)
      if (ogTitle) ogTitle.setAttribute('content', pageTitle)
      if (ogDesc) ogDesc.setAttribute('content', pageDesc)
      if (ogUrl) ogUrl.setAttribute('content', pageUrl)
      if (twTitle) twTitle.setAttribute('content', pageTitle)
      if (twDesc) twDesc.setAttribute('content', pageDesc)
      if (twUrl) twUrl.setAttribute('content', pageUrl)
    } else {
      document.title = 'प्लेलिस्ट नहीं मिली | Kaanch Ke Theke'
    }

    return () => {
      const defaultTitle = 'काँच के ठेके | Kaanch Ke Theke — Retro Bollywood Music & Nostalgic Hindi Melodies'
      const defaultDesc = 'काँच के ठेके (Kaanch Ke Theke) — पुराने बॉलीवुड गानों, यादों और महफ़िल का एक सिनेमाई संगीत अनुभव। 90s के सदाबहार नग़मे, ग़ज़लें और रेट्रो हिंदी क्लासिक्स।'
      const defaultUrl = 'https://kaanch-ke-theke.pages.dev/'

      document.title = defaultTitle
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc)
      if (canonical) canonical.setAttribute('href', defaultUrl)
      if (ogTitle) ogTitle.setAttribute('content', 'काँच के ठेके | Kaanch Ke Theke — Retro Bollywood Music')
      if (ogDesc) ogDesc.setAttribute('content', defaultDesc)
      if (ogUrl) ogUrl.setAttribute('content', defaultUrl)
      if (twTitle) twTitle.setAttribute('content', 'काँच के ठेके | Kaanch Ke Theke — Retro Bollywood Music')
      if (twDesc) twDesc.setAttribute('content', defaultDesc)
      if (twUrl) twUrl.setAttribute('content', defaultUrl)
    }
  }, [playlist])

  if (!playlist) {
    return (
      <div className="page-content-wrapper">
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item"><Link to="/">मुख्य पृष्ठ (Home)</Link></li>
            <li className="breadcrumb-separator">/</li>
            <li className="breadcrumb-item"><Link to="/playlists">प्लेलिस्ट्स (Playlists)</Link></li>
            <li className="breadcrumb-separator">/</li>
            <li className="breadcrumb-item active" aria-current="page">त्रुटि</li>
          </ol>
        </nav>
        <section className="editorial-section not-found-inline-section" aria-label="प्लेलिस्ट त्रुटि">
          <div className="editorial-container">
            <div className="editorial-content-panel not-found-content-card" role="alert">
              <div className="not-found-badge-row">
                <span className="editorial-badge">अनुपलब्ध • Not Found</span>
                <span className="editorial-meta">त्रुटि</span>
              </div>
              <h1 className="editorial-title not-found-title">यह प्लेलिस्ट उपलब्ध नहीं है</h1>
              <p className="editorial-desc not-found-desc">
                माफ़ करें, आप जिस प्लेलिस्ट की तलाश कर रहे हैं वह मौजूद नहीं है या हटा दी गई है।
              </p>
              <div className="not-found-actions">
                <button type="button" className="not-found-primary-btn" onClick={() => navigate('/playlists')}>
                  सभी प्लेलिस्ट्स देखें →
                </button>
                <Link to="/" className="not-found-secondary-btn">
                  मुख्य पृष्ठ पर जाएं
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const isCurrentPlaylist = currentPlaylist?.id === playlist.id
  const isUpcoming = Boolean(playlist.isUpcoming)

  return (
    <div className="page-content-wrapper">
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <Link to="/" className="breadcrumb-link">मुख्य पृष्ठ (Home)</Link>
          </li>
          <li className="breadcrumb-separator">/</li>
          <li className="breadcrumb-item">
            <Link to="/playlists" className="breadcrumb-link">प्लेलिस्ट्स (Playlists)</Link>
          </li>
          <li className="breadcrumb-separator">/</li>
          <li className="breadcrumb-item active" aria-current="page">{playlist.name}</li>
        </ol>
      </nav>

      <section className="editorial-section playlist-detail-section" aria-label={playlist.name}>
        <div className="editorial-container">
          <div className="editorial-content-panel full-width-panel">
            <div className="editorial-badge-row">
              <span className="editorial-badge">Playlist</span>
              <span className="editorial-meta">
                {isUpcoming ? 'शीघ्र उपलब्ध • Upcoming' : `${playlist.songs?.length || 0} चुनिंदा गीत`}
              </span>
            </div>

            <div className="playlist-detail-header-row">
              <div className="playlist-detail-title-group">
                <h1 className="editorial-title page-main-heading">{playlist.name}</h1>
                <p className="editorial-desc">{playlist.description}</p>
              </div>

              <div className="playlist-header-actions-group">
                <button
                  type="button"
                  className="editorial-action-link share-playlist-btn"
                  onClick={handleShare}
                  aria-label="प्लेलिस्ट लिंक कॉपी करें"
                >
                  🔗 लिंक साझा करें
                </button>

                {!isUpcoming && (
                  <button
                    type="button"
                    className="editorial-action-link play-playlist-hero-btn"
                    onClick={() => onSelectPlaylist(playlist.id)}
                  >
                    {isCurrentPlaylist ? 'सक्रिय प्लेलिस्ट (Playing)' : 'यह प्लेलिस्ट बजाएं ▶'}
                  </button>
                )}
              </div>
            </div>

            {copyFeedback && (
              <div
                className={`feedback-toast ${copyFeedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
                role={copyFeedback.type === 'success' ? 'status' : 'alert'}
                aria-live="polite"
              >
                {copyFeedback.message}
              </div>
            )}

            {/* Songs Table / List */}
            {playlist.songs && playlist.songs.length > 0 ? (
              <div className="songs-list-container">
                <h2 className="songs-list-heading">प्लेलिस्ट के गीत (Tracklist)</h2>
                <div className="songs-table-wrapper">
                  <table className="songs-table">
                    <thead>
                      <tr>
                        <th scope="col" className="col-num">#</th>
                        <th scope="col" className="col-title">गीत का नाम (Track Title)</th>
                        <th scope="col" className="col-artist">कलाकार (Artist)</th>
                        <th scope="col" className="col-action">सुनें</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playlist.songs.map((song, index) => (
                        <tr key={song.id || index} className="song-table-row">
                          <td className="col-num">{index + 1}</td>
                          <td className="col-title">
                            <span className="song-title-text">{song.title}</span>
                            <span className="mobile-only-artist">{song.artist}</span>
                          </td>
                          <td className="col-artist">
                            <span className="song-artist-text">{song.artist}</span>
                          </td>
                          <td className="col-action">
                            <button
                              type="button"
                              className="song-play-row-btn"
                              onClick={() => {
                                onSelectPlaylist(playlist.id)
                                if (onPlaySong && song.youtubeId) {
                                  onPlaySong(song.youtubeId)
                                }
                              }}
                              aria-label={`${song.title} बजाएं`}
                            >
                              ▶
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="upcoming-playlist-notice">
                <p className="editorial-desc">
                  यह प्लेलिस्ट जल्द ही नई धुनों और गीतों के साथ सजाई जाएगी।
                </p>
                <Link to="/playlists" className="editorial-action-link">
                  ← दूसरी प्लेलिस्ट्स देखें
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default PlaylistDetailPage
