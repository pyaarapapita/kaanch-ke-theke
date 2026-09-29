import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PLAYLISTS } from '../data/playlists'

export function PlaylistsPage({ currentPlaylist, onSelectPlaylist }) {
  useEffect(() => {
    const pageTitle = 'हिंदी म्यूज़िक प्लेलिस्ट्स | Kaanch Ke Theke — Curated Playlists'
    const pageDesc = 'काँच के ठेके की सभी चुनिंदा बॉलीवुड प्लेलिस्ट्स—90s के सदाबहार गाने, ग़ज़लें, दर्द-ए-दिल और रेट्रो हिंदी क्लासिक्स।'
    const pageUrl = 'https://kaanch-ke-theke.pages.dev/playlists'

    document.title = pageTitle
    
    let metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', pageDesc)
    }

    let canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
      canonical.setAttribute('href', pageUrl)
    }

    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', pageTitle)
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', pageDesc)
    let ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', pageUrl)

    let twTitle = document.querySelector('meta[name="twitter:title"]')
    if (twTitle) twTitle.setAttribute('content', pageTitle)
    let twDesc = document.querySelector('meta[name="twitter:description"]')
    if (twDesc) twDesc.setAttribute('content', pageDesc)
    let twUrl = document.querySelector('meta[name="twitter:url"]')
    if (twUrl) twUrl.setAttribute('content', pageUrl)

    return () => {
      const defaultTitle = 'काँच के ठेके | Kaanch Ke Theke — Retro Bollywood Music & Nostalgic Hindi Melodies'
      const defaultDesc = 'काँच के ठेके (Kaanch Ke Theke) — पुराने बॉलीवुड गानों, यादों और महफ़िल का एक सिनेमाई संगीत अनुभव। 90s के सदाबहार नग़मे, ग़ज़लें और रेट्रो हिंदी क्लासिक्स।'
      const defaultUrl = 'https://kaanch-ke-theke.pages.dev/'

      document.title = defaultTitle
      if (metaDesc) {
        metaDesc.setAttribute('content', defaultDesc)
      }
      if (canonical) {
        canonical.setAttribute('href', defaultUrl)
      }
      if (ogTitle) ogTitle.setAttribute('content', 'काँच के ठेके | Kaanch Ke Theke — Retro Bollywood Music')
      if (ogDesc) ogDesc.setAttribute('content', 'काँच के ठेके — पुराने बॉलीवुड गानों, यादों और महफ़िल का एक सिनेमाई संगीत अनुभव। 90s के सदाबहार नग़मे और रेट्रो क्लासिक्स।')
      if (ogUrl) ogUrl.setAttribute('content', defaultUrl)
      if (twTitle) twTitle.setAttribute('content', 'काँच के ठेके | Kaanch Ke Theke — Retro Bollywood Music')
      if (twDesc) twDesc.setAttribute('content', 'काँच के ठेके — पुराने बॉलीवुड गानों, यादों और महफ़िल का एक सिनेमाई संगीत अनुभव। 90s के सदाबहार नग़मे और रेट्रो क्लासिक्स।')
      if (twUrl) twUrl.setAttribute('content', defaultUrl)
    }
  }, [])

  return (
    <div className="page-content-wrapper">
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <Link to="/" className="breadcrumb-link">मुख्य पृष्ठ (Home)</Link>
          </li>
          <li className="breadcrumb-separator">/</li>
          <li className="breadcrumb-item active" aria-current="page">प्लेलिस्ट्स (Playlists)</li>
        </ol>
      </nav>

      <section className="editorial-section playlists-overview-page" aria-label="सभी हिंदी म्यूज़िक प्लेलिस्ट्स">
        <div className="editorial-container">
          <div className="editorial-content-panel full-width-panel">
            <div className="editorial-badge-row">
              <span className="editorial-badge">All Playlists</span>
              <span className="editorial-meta">Curated Retro Music</span>
            </div>
            <h1 className="editorial-title page-main-heading">
              चुनिंदा रेट्रो बॉलीवुड प्लेलिस्ट्स (Curated Hindi Playlists)
            </h1>
            <p className="editorial-desc page-intro-desc">
              हर शाम का एक अलग रंग और हर याद का अपना एक नग़मा होता है। नीचे काँच के ठेके की सभी चुनिंदा प्लेलिस्ट्स दी गई हैं। अपनी पसंद का मूड चुनें और महफ़िल का हिस्सा बनें।
            </p>

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
                      <h2 className="playlist-card-title">
                        <Link to={`/playlists/${pl.id}`} className="playlist-title-link">
                          {pl.name}
                        </Link>
                      </h2>
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
                          विवरण देखें →
                        </Link>
                        {!isUpcoming && (
                          <button
                            type="button"
                            className="card-action-btn play-btn"
                            onClick={() => onSelectPlaylist(pl.id)}
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
    </div>
  )
}
