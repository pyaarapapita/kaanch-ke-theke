import React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYLISTS } from '../data/playlists'

const SITE_CONFIG = {
  INSTAGRAM_URL: 'https://www.instagram.com/ironically_anujj',
  BUY_ME_A_COFFEE_URL: 'https://buymeacoffee.com/kaanchketheke'
}

export const HomePageView = React.memo(function HomePageView({
  hasEntered,
  isVideoTransitioning,
  currentPlaylist,
  playlistSongs = [],
  currentSongIndex = 0,
  isPlaying = false,
  handleStartEntryTransition,
  handleSelectPlaylist,
  handlePlaySong,
  setShowAbout
}) {
  return (
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
            अपने किरदार से महकता है इंसान, चरित्र पवित्र करने का इत्र नहीं आता
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
        {/* Section 1: Active Session & Tracklist */}
        <section
          id="active-tracklist-section"
          className="editorial-section active-session-section"
          aria-label="सक्रिय महफ़िल और गीत सूची"
        >
          <div className="editorial-container active-session-container">
            <div className="editorial-content-panel full-width-panel">
              <div className="session-header-row">
                <div className="session-header-info">
                  <div className="editorial-badge-row">
                    <span className="editorial-badge">आज की महफ़िल • Current Session</span>
                    <span className="editorial-meta">
                      {playlistSongs.length} सदाबहार नग़मे
                    </span>
                  </div>
                  <h2 className="editorial-title session-title">
                    {currentPlaylist?.name || '९०s की बोतल 🍾'}
                  </h2>
                  <p className="editorial-desc session-desc">
                    {currentPlaylist?.description || 'पुराने नग़मे, यादें और महफ़िल का सुरूर।'}
                  </p>
                </div>

                {/* Inline Mood Switcher Pills */}
                <div className="session-mood-pills-row" role="group" aria-label="मूड चुनें">
                  {PLAYLISTS.map((pl) => {
                    const isPlActive = currentPlaylist?.id === pl.id
                    const isPlUpcoming = Boolean(pl.isUpcoming)
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        className={`mood-pill-chip ${isPlActive ? 'active' : ''} ${isPlUpcoming ? 'upcoming' : ''}`}
                        onClick={() => !isPlUpcoming && handleSelectPlaylist(pl.id)}
                        disabled={isPlUpcoming}
                        title={isPlUpcoming ? `${pl.name} (शीघ्र उपलब्ध)` : pl.name}
                      >
                        {pl.name}
                        {isPlActive && <span className="pill-active-dot" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tracklist Rows */}
              <div className="session-tracklist" role="list">
                {playlistSongs.map((song, idx) => {
                  const isThisSongActive = currentSongIndex === idx
                  const isThisSongPlaying = isPlaying && isThisSongActive
                  return (
                    <div
                      key={song.id || idx}
                      className={`track-item-card ${isThisSongActive ? 'active-track' : ''}`}
                      onClick={() => handlePlaySong(song.youtubeId || song.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handlePlaySong(song.youtubeId || song.id)
                        }
                      }}
                      aria-label={`${song.title} — ${song.artist}`}
                    >
                      <div className="track-left-cell">
                        <span className="track-number">{idx + 1}</span>
                        {isThisSongPlaying ? (
                          <span className="track-playing-equalizer" title="बज रहा है">
                            <span className="eq-bar bar-1" />
                            <span className="eq-bar bar-2" />
                            <span className="eq-bar bar-3" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="track-play-icon-btn"
                            aria-label={`${song.title} चलाएं`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlaySong(song.youtubeId || song.id)
                            }}
                          >
                            ▶
                          </button>
                        )}
                      </div>

                      <div className="track-info-cell">
                        <div className="track-title-row">
                          <span className="track-title-text">{song.title}</span>
                          {isThisSongActive && (
                            <span className="track-active-tag">अब बज रहा है</span>
                          )}
                        </div>
                        <span className="track-artist-text">{song.artist}</span>
                      </div>

                      <div className="track-right-cell">
                        <span className="track-duration-text">{song.duration || 'रेट्रो'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Curated Playlists Showcase */}
        <section className="editorial-section playlists-section" aria-label="चुनिंदा हिंदी म्यूज़िक प्लेलिस्ट्स">
          <div className="editorial-container">
            <div className="editorial-content-panel full-width-panel">
              <div className="editorial-badge-row">
                <span className="editorial-badge">संग्रह • Curated Collections</span>
                <span className="editorial-meta">Retro Bollywood &amp; Hindi Classics</span>
              </div>
              <h2 className="editorial-title">चुनिंदा रेट्रो बॉलीवुड प्लेलिस्ट्स (Curated Moods)</h2>
              <p className="editorial-desc">
                हर शाम का एक अलग रंग और हर याद का अपना एक नग़मा। अपनी पसंद की महफ़िल चुनें।
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

        {/* Section 3: About the Theka */}
        <section className="editorial-section story-section" aria-label="काँच के ठेके के बारे में">
          <div className="editorial-container">
            <div className="editorial-visual-panel">
              <picture>
                <source srcSet="/backgrounds/editorial-story.webp" type="image/webp" />
                <img
                  src="/backgrounds/editorial-story.png"
                  alt="पुराने विनाइल रिकॉर्ड और क्लासिक हिंदी संगीत का माहौल"
                  className="editorial-img"
                  loading="lazy"
                  decoding="async"
                  width="520"
                  height="390"
                />
              </picture>
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
                पूरी कहानी पढ़ें →
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Community & Support */}
        <section className="editorial-section community-section" aria-label="कम्युनिटी और सहयोग">
          <div className="community-cards-grid">
            {/* Instagram Card */}
            <div className="community-card instagram-community-card">
              <div className="community-card-visual">
                <picture>
                  <source srcSet="/backgrounds/editorial-instagram.webp" type="image/webp" />
                  <img
                    src="/backgrounds/editorial-instagram.png"
                    alt="रेट्रो कैसेट प्लेयर, कैमरा और शाम का सुकून"
                    className="community-card-img"
                    loading="lazy"
                    decoding="async"
                    width="520"
                    height="260"
                  />
                </picture>
                <div className="visual-overlay-vignette" />
              </div>
              <div className="community-card-body">
                <span className="editorial-badge">Instagram Community</span>
                <h3 className="community-card-title">महफ़िल स्क्रीन से बाहर भी जारी है</h3>
                <p className="community-card-desc">
                  अगर इस छोटी-सी महफ़िल ने आपको कुछ देर ठहरने पर मजबूर किया, तो Instagram पर मिलिए। वहाँ इस प्रोजेक्ट के पीछे की सोच और नए अपडेट्स मिलेंगे।
                </p>
                <a
                  href={SITE_CONFIG.INSTAGRAM_URL}
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="editorial-action-link instagram-link"
                >
                  Instagram पर जुड़ें →
                </a>
              </div>
            </div>

            {/* Support Creator Card */}
            <div className="community-card support-community-card">
              <div className="community-card-visual">
                <picture>
                  <source srcSet="/backgrounds/theka-bg.webp" type="image/webp" />
                  <img
                    src="/backgrounds/theka-bg.png"
                    alt="काँच के ठेके की अगली बोतल — सहयोग"
                    className="community-card-img"
                    loading="lazy"
                    decoding="async"
                    width="520"
                    height="260"
                  />
                </picture>
                <div className="visual-overlay-vignette" />
              </div>
              <div className="community-card-body">
                <span className="editorial-badge">Support The Theka</span>
                <h3 className="community-card-title">मेरी अगली बोतल के लिए</h3>
                <p className="community-card-desc">
                  काँच के ठेके एक स्वतंत्र, विज्ञापन-मुक्त संगीत प्रयास है। अगर आपको यहाँ सुकून मिला, तो अपनी पसंद से अगली बोतल या चाय स्पॉन्सर कर सकते हैं।
                </p>
                <a
                  href={SITE_CONFIG.BUY_ME_A_COFFEE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-action-link support-action-link"
                >
                  सहयोग करें 🍾
                </a>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </>
  )
})
