import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYLISTS } from '../data/playlists'
import { ThekaCounter } from './ThekaCounter/ThekaCounter'

const SITE_CONFIG = {
  INSTAGRAM_URL: 'https://www.instagram.com/ironically_anujj',
  BUY_ME_A_COFFEE_URL: 'https://buymeacoffee.com/kaanchketheke'
}

const THEKA_SHAYARI_COLLECTION = [
  {
    id: 'ghalib-1',
    sher: 'हज़ारों ख़्वाहिशें ऐसी कि हर ख़्वाहिश पे दम निकले,\nबहुत निकले मिरे अरमाँ लेकिन फिर भी कम निकले।',
    poet: 'मिर्ज़ा ग़ालिब',
    era: 'क्लासिक ग़ज़ल दौर',
    context: 'गायन: जगजीत सिंह • अमर नज़्म'
  },
  {
    id: 'sahir-1',
    sher: 'मैं ज़िंदगी का साथ निभाता चला गया,\nहर फ़िक्र को धुएँ में उड़ाता चला गया।',
    poet: 'साहिर लुधियानवी',
    era: 'हम दोनों (१९६१)',
    context: 'गायन: मुहम्मद रफ़ी • संगीत: जयदेव'
  },
  {
    id: 'gulzar-1',
    sher: 'आँखों में जल रहा है क्यूँ बुझता नहीं धुआँ,\nउठता है दिल से दर्द कि रुकता नहीं धुआँ।',
    poet: 'गुलज़ार',
    era: 'माचिस (१९९६)',
    context: 'गायन: सुरेश वाडेकर • संगीत: विशाल भारद्वाज'
  },
  {
    id: 'fakir-1',
    sher: 'ये दौलत भी ले लो, ये शोहरत भी ले लो,\nभले छीन लो मुझसे मेरी जवानी...\nमगर मुझको लौटा दो बचपन का सावन,\nवो काग़ज़ की कश्ती, वो बारिश का पानी।',
    poet: 'सुदर्शन फ़ाकिर',
    era: 'आज (१९८२)',
    context: 'गायन: जगजीत सिंह & चित्रा सिंह'
  },
  {
    id: 'shailendra-1',
    sher: 'गाता रहे मेरा दिल, तू ही मेरी मंज़िल,\nकहीं बीतें ना ये रातें, कहीं बीतें ना ये दिन।',
    poet: 'शैलेंद्र',
    era: 'गाइड (१९६५)',
    context: 'गायन: किशोर कुमार & लता मंगेशकर • संगीत: एस. डी. बर्मन'
  },
  {
    id: 'sahir-2',
    sher: 'कभी कभी मेरे दिल में ख़याल आता है,\nकि जैसे तुझको बनाया गया है मेरे लिए।',
    poet: 'साहिर लुधियानवी',
    era: 'कभी कभी (१९७६)',
    context: 'गायन: मुकेश • संगीत: खय्याम'
  },
  {
    id: 'hasrat-1',
    sher: 'चुपके चुपके रात दिन आँसू बहाना याद है,\nहमको अब तक आशिक़ी का वो ज़माना याद है।',
    poet: 'हसरत मोहानी',
    era: 'निकाह (१९८२)',
    context: 'गायन: ग़ुलाम अली • क्लासिक तराना'
  },
  {
    id: 'bakshi-1',
    sher: 'ज़िंदगी के सफ़र में गुज़र जाते हैं जो मक़ाम,\nवो फिर नहीं आते, वो फिर नहीं आते।',
    poet: 'आनंद बक्षी',
    era: 'आप की कसम (१९७४)',
    context: 'गायन: किशोर कुमार • संगीत: आर. डी. बर्मन'
  }
]

const THEKA_MOOD_VIBES = [
  {
    id: '90s',
    title: '९०s की बोतल 🍾',
    tagline: 'वॉकमैन व कैसेट का दौर',
    desc: 'पेंसिल से रील लपेटना, ऑटो-रिवर्स कैसेट और देर रात छत पर बजता ट्रांजिस्टर।',
    icon: '📼',
    chip: 'सक्रिय महफ़िल',
    isUpcoming: false
  },
  {
    id: 'mahfil',
    title: 'काँच के जाम व ग़ज़ल 🌙',
    tagline: 'धीमी रात की महफ़िल',
    desc: 'जगजीत सिंह का सोज़, जलती लालटेन और काँच के गिलासों में उतरता सुकून।',
    icon: '🍷',
    chip: 'शीघ्र उपलब्ध',
    isUpcoming: true
  },
  {
    id: 'barish-aur-yaadein',
    title: 'रिमझिम बारिश 🌧️',
    tagline: 'भीगी शाम और पुरानी धुन',
    desc: 'खिड़की पर गिरती बूँदें, कुल्हड़ वाली चाय और किशोर दा के भीगे नग़मे।',
    icon: '🌧️',
    chip: 'शीघ्र उपलब्ध',
    isUpcoming: true
  },
  {
    id: 'dard-e-dil',
    title: 'दर्द-ए-दिल 💔',
    tagline: 'तन्हाई और पुराना अफ़साना',
    desc: 'टूटे दिलों की दास्तान और मुहम्मद रफ़ी के वो नग़मे जो सीधा रूह में उतर जाएं।',
    icon: '💔',
    chip: 'शीघ्र उपलब्ध',
    isUpcoming: true
  }
]

const NOSTALGIA_CHIPS = [
  {
    id: 'radio',
    icon: '📻',
    title: 'आकाशवाणी व छायागीत',
    desc: 'रात १० बजे अमीन सयानी की चिर-परिचित आवाज़ और बिनाका गीतमाला का सुरूर'
  },
  {
    id: 'cassette',
    icon: '📼',
    title: 'मिक्स-टेप रिकॉर्डिंग दौर',
    desc: 'नुक्कड़ की कैसेट शॉप पर स्पेशल फ़रमाइश से ए और बी साइड भरवाने का जादू'
  },
  {
    id: 'chai',
    icon: '☕',
    title: 'नुक्कड़ की चाय और अड्डा',
    desc: 'कुल्हड़ वाली कड़क चाय के साथ दूर पान की गुमटी से तैरती रफ़ी साहब की सदा'
  }
]

export const HomePageView = React.memo(function HomePageView({
  hasEntered,
  isVideoTransitioning,
  currentPlaylist,
  isPlaying = false,
  handleStartEntryTransition,
  handleSelectPlaylist,
  setShowAbout
}) {
  const [shayariIndex, setShayariIndex] = useState(0)
  const activeSher = THEKA_SHAYARI_COLLECTION[shayariIndex]

  const handleNextShayari = () => {
    setShayariIndex((prev) => (prev + 1) % THEKA_SHAYARI_COLLECTION.length)
  }

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
        {/* Interactive Theka Counter Experience (Bottle, Glass, Radio & Keepsakes) */}
        <ThekaCounter
          currentPlaylist={currentPlaylist}
          onSelectPlaylist={handleSelectPlaylist}
        />

        {/* Section 1: Theka Chronicles & Shayari Wall */}
        <section
          id="theka-chronicles-section"
          className="editorial-section theka-chronicles-section"
          aria-label="ठेके की दास्तान, शायरी और रेट्रो यादें"
        >
          <div className="editorial-container theka-chronicles-container">
            <div className="editorial-content-panel full-width-panel">
              {/* Header Row */}
              <div className="theka-chronicles-header-row">
                <div className="theka-header-titles">
                  <div className="editorial-badge-row">
                    <span className="editorial-badge">ठेके की दास्तान • Theka Chronicles</span>
                    <span className="editorial-meta">साहिर, गुलज़ार, ग़ालिब और रफ़ी का दौर</span>
                  </div>
                  <h2 className="editorial-title theka-chronicles-title">
                    महफ़िल का शेर और चार पहर के मिज़ाज
                  </h2>
                  <p className="editorial-desc theka-chronicles-desc">
                    जब रात गहराती है और काँच के गिलासों में पुरानी यादें उतरती हैं, तब धुन और शायरी मिलकर दिल का हाल बयां करते हैं।
                  </p>
                </div>
              </div>

              {/* Centerpiece: Interactive Mehfil Shayari Card */}
              <div className="theka-shayari-card" role="region" aria-label="आज का शेर">
                <div className="shayari-card-top-bar">
                  <div className="shayari-badge-group">
                    <span className="shayari-flame-icon" aria-hidden="true">🕯️</span>
                    <span className="shayari-card-label">महफ़िल की रुबाई • Sher #{shayariIndex + 1}</span>
                  </div>

                  <button
                    type="button"
                    className="shayari-cycle-btn"
                    onClick={handleNextShayari}
                    aria-label="दूसरा शेर पढ़ें"
                    title="दूसरा शेर देखें"
                  >
                    <span className="cycle-btn-text">दूसरा शेर</span>
                    <span className="cycle-btn-icon" aria-hidden="true">↻</span>
                  </button>
                </div>

                <div className="shayari-content-box">
                  <span className="shayari-quote-mark open" aria-hidden="true">“</span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSher.id}
                      className="shayari-body-motion"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                      <blockquote className="theka-sher-text">
                        {activeSher.sher.split('\n').map((line, i) => (
                          <span key={i} className="sher-line">
                            {line}
                          </span>
                        ))}
                      </blockquote>

                      <div className="theka-sher-attribution">
                        <div className="sher-poet-row">
                          <span className="sher-poet-name">— {activeSher.poet}</span>
                          <span className="sher-era-tag">{activeSher.era}</span>
                        </div>
                        <span className="sher-context-note">{activeSher.context}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <span className="shayari-quote-mark close" aria-hidden="true">”</span>
                </div>
              </div>

              {/* The 4 Spirits / Mood Vignettes Grid */}
              <div className="theka-vibes-wrapper">
                <div className="theka-vibes-header">
                  <h3 className="theka-sub-heading">चार पहर, चार मिज़ाज (Theka Mood Spirits)</h3>
                  <span className="theka-sub-meta">अपनी पसंद की महफ़िल का सुरूर चुनें</span>
                </div>

                <div className="theka-vibes-grid" role="list">
                  {THEKA_MOOD_VIBES.map((vibe) => {
                    const isVibeActive = currentPlaylist?.id === vibe.id
                    const isUpcoming = vibe.isUpcoming
                    return (
                      <div
                        key={vibe.id}
                        className={`theka-vibe-card ${isVibeActive ? 'is-active-vibe' : ''} ${isUpcoming ? 'is-upcoming-vibe' : ''}`}
                        role="listitem"
                      >
                        <div className="vibe-card-header">
                          <span className="vibe-card-icon" aria-hidden="true">{vibe.icon}</span>
                          {isVibeActive ? (
                            <span className="vibe-status-badge active">
                              {isPlaying && (
                                <span className="vibe-eq-indicator" aria-hidden="true">
                                  <span className="vibe-eq-bar bar-1" />
                                  <span className="vibe-eq-bar bar-2" />
                                  <span className="vibe-eq-bar bar-3" />
                                </span>
                              )}
                              <span>सक्रिय</span>
                            </span>
                          ) : isUpcoming ? (
                            <span className="vibe-status-badge upcoming">शीघ्र उपलब्ध</span>
                          ) : null}
                        </div>

                        <div className="vibe-card-body">
                          <h4 className="vibe-card-title">{vibe.title}</h4>
                          <span className="vibe-card-tagline">{vibe.tagline}</span>
                          <p className="vibe-card-desc">{vibe.desc}</p>
                        </div>

                        <div className="vibe-card-action">
                          {isUpcoming ? (
                            <Link to={`/playlists/${vibe.id}`} className="vibe-card-btn view-link">
                              विवरण देखें →
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className={`vibe-card-btn play-select-btn ${isVibeActive ? 'selected' : ''}`}
                              onClick={() => handleSelectPlaylist(vibe.id)}
                            >
                              {isVibeActive ? 'यह महफ़िल जारी है 🍾' : 'यह महफ़िल चुनें ▶'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Retro Nostalgia Cultural Chips */}
              <div className="theka-nostalgia-chips-row" role="region" aria-label="रेट्रो बॉलीवुड यादें">
                {NOSTALGIA_CHIPS.map((chip) => (
                  <div key={chip.id} className="theka-nostalgia-chip">
                    <span className="nostalgia-chip-icon" aria-hidden="true">{chip.icon}</span>
                    <div className="nostalgia-chip-content">
                      <strong className="nostalgia-chip-title">{chip.title}</strong>
                      <span className="nostalgia-chip-desc">{chip.desc}</span>
                    </div>
                  </div>
                ))}
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
