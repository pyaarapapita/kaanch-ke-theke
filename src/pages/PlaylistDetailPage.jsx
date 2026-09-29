import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPlaylistById } from '../data/playlists'

export function PlaylistDetailPage({ currentPlaylist, onSelectPlaylist, onPlaySong }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const playlist = getPlaylistById(id)

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
            <li className="breadcrumb-item"><Link to="/">मुख्य पृष्ठ</Link></li>
            <li className="breadcrumb-separator">/</li>
            <li className="breadcrumb-item"><Link to="/playlists">प्लेलिस्ट्स</Link></li>
          </ol>
        </nav>
        <section className="editorial-section">
          <div className="editorial-container">
            <div className="editorial-content-panel">
              <h1 className="editorial-title">यह प्लेलिस्ट उपलब्ध नहीं है</h1>
              <p className="editorial-desc">माफ़ करें, आप जिस प्लेलिस्ट की तलाश कर रहे हैं वह मौजूद नहीं है।</p>
              <button type="button" className="editorial-action-link" onClick={() => navigate('/playlists')}>
                सभी प्लेलिस्ट्स देखें →
              </button>
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
              <div>
                <h1 className="editorial-title page-main-heading">{playlist.name}</h1>
                <p className="editorial-desc">{playlist.description}</p>
              </div>

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
