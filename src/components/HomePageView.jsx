import React, { useMemo } from 'react'
import { ThekaCounter } from './ThekaCounter/ThekaCounter'
import { MusicalTimeMachine } from './MusicalTimeMachine/MusicalTimeMachine'
import { RewindGame } from './RewindGame/RewindGame'
import { VinylHero } from './VinylHero/VinylHero'
import { VinylHeroErrorBoundary } from './VinylHero/VinylHeroErrorBoundary'
import { Chapter } from './Home/Chapter'
import { ChapterRail } from './Home/ChapterRail'
import { ShayariWall } from './Home/ShayariWall'
import { MoodShelf } from './Home/MoodShelf'
import { pulseScene } from '../utils/scenePulse'
import './VinylHero/VinylHero.css'
import './Home/Home.css'

const SITE_CONFIG = {
  INSTAGRAM_URL: 'https://www.instagram.com/ironically_anujj',
  BUY_ME_A_COFFEE_URL: 'https://buymeacoffee.com/kaanchketheke'
}

export const HomePageView = React.memo(function HomePageView({
  hasEntered,
  isVideoTransitioning,
  playlists,
  currentPlaylist,
  isPlaying = false,
  handleStartEntryTransition,
  onEntryIntent,
  isSceneReady = false,
  handleSelectPlaylist,
  handlePlaySong,
  setShowAbout
}) {
  // The rewind game deals from the first playlist that has songs in it.
  const rewindPlaylist = useMemo(
    () => playlists.find((playlist) => !playlist.isUpcoming && playlist.songs?.length > 0) || null,
    [playlists]
  )

  const handleMoodSelect = (playlistId) => {
    handleSelectPlaylist(playlistId)
    pulseScene(0.7)
  }

  return (
    <>
      {/* Hero text, poster and framing. The 3D itself lives in ExperienceLayer, behind the whole page */}
      <VinylHeroErrorBoundary
        hasEntered={hasEntered}
        isVideoTransitioning={isVideoTransitioning}
        handleStartEntryTransition={handleStartEntryTransition}
      >
        <VinylHero
          hasEntered={hasEntered}
          isVideoTransitioning={isVideoTransitioning}
          handleStartEntryTransition={handleStartEntryTransition}
          onEntryIntent={onEntryIntent}
          isSceneReady={isSceneReady}
        />
      </VinylHeroErrorBoundary>

      {hasEntered && <ChapterRail />}

      <div className={`home-flow ${hasEntered ? 'is-entered' : ''}`}>
        <Chapter
          id="chapter-counter"
          number="०१"
          kicker="The Counter"
          title="काउण्टर की अमानत"
          lede="यह केवल एक वेबसाइट नहीं, रात के पहर का वही चिर-परिचित ठेका है। काउण्टर पर रखी हर चीज़ से एक याद जुड़ी है — पीतल की लालटेन, पुराने हिसाब की पर्ची और 1990 की एक माचिस।"
          layout="split"
        >
          <ThekaCounter />
        </Chapter>

        <Chapter
          id="chapter-shayari"
          number="०२"
          kicker="Mehfil Shayari"
          title="महफ़िल से एक शेर"
          lede="जब रात गहराती है और काँच के गिलासों में पुरानी यादें उतरती हैं, तब धुन और शायरी मिलकर दिल का हाल बयां करते हैं।"
          layout="center"
        >
          <ShayariWall />
        </Chapter>

        <Chapter
          id="chapter-machine"
          number="०३"
          kicker="Time Machine"
          title="संगीत का टाइम मशीन"
          lede="पुरानी दुकान की धूल जमी रिकॉर्ड रैक से जैसे अचानक कोई अनमोल विनाइल हाथ लग जाए। पहिया घुमाइए और देखिए आज की रात कौन-सा मिज़ाज आपका इंतज़ार कर रहा है।"
          layout="center"
        >
          <MusicalTimeMachine
            onSelectPlaylist={handleSelectPlaylist}
            handlePlaySong={handlePlaySong}
            currentPlaylist={currentPlaylist}
          />
        </Chapter>

        <Chapter
          id="chapter-rewind"
          number="०४"
          kicker="Pencil Rewind"
          title="पेंसिल से रील लपेटो"
          lede="याद है? वॉकमैन की बैटरी बचाने के लिए कैसेट में पेंसिल फँसाकर रील घुमाना। वही खेल फिर खेलिए — रील लपेटिए, साल 1990 तक लौटिए और टेप को आपके लिए एक नग़मा चुनने दीजिए।"
          layout="split"
          className="chapter--flip"
        >
          <RewindGame
            songs={rewindPlaylist?.songs || []}
            playlistId={rewindPlaylist?.id || null}
            onPlaySong={handlePlaySong}
          />
        </Chapter>

        <Chapter
          id="chapter-moods"
          number="०५"
          kicker="The Mixtapes"
          title="हर मिज़ाज की एक टेप"
          lede="अपनी शाम के हिसाब से टेप उठाइए। जो तैयार हैं वो अभी बजेंगी, बाक़ी रिकॉर्डिंग में हैं।"
        >
          <MoodShelf
            playlists={playlists}
            activePlaylistId={currentPlaylist?.id}
            isPlaying={isPlaying}
            onSelectPlaylist={handleMoodSelect}
          />
        </Chapter>

        <Chapter
          id="chapter-story"
          number="०६"
          kicker="The Story"
          title="ठेके के पीछे की कहानी"
        >
          <div className="story-grid">
            <div className="story-text">
              <p className="story-tagline">एक डिजिटल महफ़िल, 90s के सदाबहार नग़मे और रेट्रो हिंदी संगीत</p>
              <p className="chapter-lede">
                काँच के ठेके (Kaanch Ke Theke) एक अनोखा ऑनलाइन संगीत अनुभव है — पुराने बॉलीवुड गीतों, 90 के दौर के सदाबहार नग़मों, ग़ज़लों और बीती यादों के नाम। यहाँ हर प्लेलिस्ट एक ख़ास मूड और शाम के सुकून को ध्यान में रखकर तैयार की गई है, ताकि आप बिना किसी झंझट के बेहतरीन हिंदी क्लासिक्स का आनंद ले सकें।
              </p>
              <button type="button" className="editorial-action-link" onClick={() => setShowAbout(true)}>
                पूरी कहानी पढ़ें →
              </button>
            </div>
            <figure className="story-figure">
              <img
                src="/backgrounds/editorial-story.webp"
                alt="पुराने विनाइल रिकॉर्ड और क्लासिक हिंदी संगीत का माहौल"
                loading="lazy"
                decoding="async"
                width="520"
                height="390"
              />
            </figure>
          </div>
        </Chapter>

        <section className="chapter community" aria-label="कम्युनिटी और सहयोग">
          <div className="chapter-inner community-grid">
            <article className="community-card">
              <img
                className="community-card-img"
                src="/backgrounds/editorial-instagram.webp"
                alt="रेट्रो कैसेट प्लेयर, कैमरा और शाम का सुकून"
                loading="lazy"
                decoding="async"
                width="520"
                height="260"
              />
              <div className="community-card-body">
                <span className="chapter-kicker">Instagram</span>
                <h3 className="community-card-title">महफ़िल स्क्रीन से बाहर भी जारी है</h3>
                <p className="community-card-desc">
                  अगर इस छोटी-सी महफ़िल ने आपको कुछ देर ठहरने पर मजबूर किया, तो Instagram पर मिलिए। वहाँ इस प्रोजेक्ट के पीछे की सोच और नए अपडेट्स मिलेंगे।
                </p>
                <a href={SITE_CONFIG.INSTAGRAM_URL} target="_blank" rel="me noopener noreferrer" className="text-link">
                  Instagram पर जुड़ें →
                </a>
              </div>
            </article>

            <article className="community-card">
              <img
                className="community-card-img"
                src="/backgrounds/theka-bg.webp"
                alt="काँच के ठेके की अगली बोतल — सहयोग"
                loading="lazy"
                decoding="async"
                width="520"
                height="260"
              />
              <div className="community-card-body">
                <span className="chapter-kicker">Support</span>
                <h3 className="community-card-title">मेरी अगली बोतल के लिए</h3>
                <p className="community-card-desc">
                  काँच के ठेके एक स्वतंत्र, विज्ञापन-मुक्त संगीत प्रयास है। अगर आपको यहाँ सुकून मिला, तो अपनी पसंद से अगली बोतल या चाय स्पॉन्सर कर सकते हैं।
                </p>
                <a href={SITE_CONFIG.BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer" className="text-link">
                  सहयोग करें →
                </a>
              </div>
            </article>
          </div>
        </section>
      </div>
    </>
  )
})
