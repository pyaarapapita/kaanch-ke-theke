import React, { useState, useCallback } from 'react'
import { BottleAndGlassScene } from './BottleAndGlassScene'
import { VintageRadio } from './VintageRadio'
import { ThekaLantern } from './ThekaLantern'
import { HandwrittenReceiptModal } from './HandwrittenReceiptModal'

/**
 * ThekaCounter — The Physical Interactive Counter Experience
 * Central hub for:
 * - Signature Bottle and Glass pouring interaction (tap & scroll-driven)
 * - Interactive Vintage Transistor Radio with station tuning
 * - Handwritten Theka Receipt Modal
 * - Atmospheric Kerosene Lantern lighting
 */
export const ThekaCounter = React.memo(function ThekaCounter({
  currentPlaylist,
  onSelectPlaylist
}) {
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lanternBrightness, setLanternBrightness] = useState('medium')

  const handleOpenReceipt = useCallback(() => {
    setIsReceiptOpen(true)
  }, [])

  const handleCloseReceipt = useCallback(() => {
    setIsReceiptOpen(false)
  }, [])

  const handleFlameChange = useCallback((level) => {
    setLanternBrightness(level)
  }, [])

  return (
    <section
      id="theka-counter-experience"
      className={`theka-counter-section lantern-ambient-${lanternBrightness}`}
      aria-label="ठेके में एक शाम — लकड़ी का काउण्टर व जाम"
    >
      <div className="theka-counter-container">
        {/* Experience Header */}
        <div className="counter-narrative-header">
          <div className="editorial-badge-row">
            <span className="editorial-badge">ठेके में एक शाम • The Counter Experience</span>
            <span className="editorial-meta">१९९० की रात, लकड़ी की मेज़ व पुरानी यादें</span>
          </div>
          <h2 className="editorial-title counter-main-title">
            काउण्टर की दास्तान — बोतल, जाम और पुराना रेडियो
          </h2>
          <p className="editorial-desc counter-main-desc">
            यह केवल एक वेबसाइट नहीं, बल्कि रात के पहर का वही चिर-परिचित ठेका है। काउण्टर पर रखी हर चीज़ से एक याद जुड़ी है—बोतल खोलिए, जाम भरिए और रेडियो के सुर सुनिए।
          </p>
        </div>

        {/* Counter Stage Top Bar: Objects Quick Bar */}
        <div className="counter-objects-bar">
          <div className="counter-objects-hint">
            <span className="objects-icon" aria-hidden="true">🍶</span>
            <span className="objects-label">काउण्टर की चीज़ें (Explore Objects):</span>
          </div>

          <div className="counter-quick-buttons">
            {/* Receipt Trigger Chip */}
            <button
              type="button"
              className="theka-object-chip receipt-chip"
              onClick={handleOpenReceipt}
              aria-label="ठेके का हिसाब-किताब पर्ची खोलें"
            >
              <span className="chip-icon">📜</span>
              <span>ठेके का हिसाब (Ledger Slip)</span>
            </button>

            {/* Radio Anchor Chip */}
            <a href="#theka-radio-cabinet" className="theka-object-chip radio-chip">
              <span className="chip-icon">📻</span>
              <span>मुसाफ़िर रेडियो (Transistor)</span>
            </a>
          </div>
        </div>

        {/* Scene 1: Signature Bottle and Glass Scene */}
        <div className="theka-bottle-scene-block">
          <BottleAndGlassScene
            activePlaylistTitle={currentPlaylist?.name || '९०s की बोतल 🍾'}
          />
        </div>

        {/* Scene 2: Interactive Counter Shelf (Radio + Lantern + Receipt Note) */}
        <div id="theka-radio-cabinet" className="counter-shelf-dual-grid">
          {/* Left Column: Vintage Transistor Radio */}
          <div className="shelf-column radio-column">
            <div className="shelf-item-header">
              <span className="shelf-badge">आकाशवाणी व ट्रांजिस्टर</span>
              <h4 className="shelf-title">रेडियो के सुर (Tuned Melodies)</h4>
            </div>
            <VintageRadio
              currentPlaylistId={currentPlaylist?.id}
              onSelectStation={onSelectPlaylist}
            />
          </div>

          {/* Right Column: Physical Memorabilia Desk (Lantern + Handwritten Slip) */}
          <div className="shelf-column memorabilia-column">
            <div className="shelf-item-header">
              <span className="shelf-badge">स्मृतियाँ व रौशनी</span>
              <h4 className="shelf-title">मेज़ की अमानत (Counter Keepsakes)</h4>
            </div>

            <div className="memorabilia-desk-card">
              {/* Interactive Lantern */}
              <div className="desk-lantern-wrapper">
                <ThekaLantern onFlameChange={handleFlameChange} />
                <div className="lantern-instruction-text">
                  <strong>पीतल की लालटेन</strong>
                  <span>क्लिक करके लौ की तीव्रता बदलें</span>
                </div>
              </div>

              {/* Physical Worn Receipt on Desk */}
              <div
                className="desk-physical-receipt"
                role="button"
                tabIndex={0}
                onClick={handleOpenReceipt}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleOpenReceipt()
                  }
                }}
                aria-label="काउण्टर पर रखी हिसाब की पर्ची पढ़ें"
              >
                <div className="receipt-paper-visual">
                  <div className="receipt-paper-header">
                    <span className="receipt-mini-stamp">प्रमाणित</span>
                    <strong className="receipt-mini-title">काँच के ठेके • पर्ची</strong>
                  </div>
                  <p className="receipt-mini-quote">
                    “२ घूँट पुराने नग़मे, भरपूर यादों का सुरूर...”
                  </p>
                  <span className="receipt-tap-cta">पूरी पर्ची पढ़ें →</span>
                </div>
              </div>

              {/* Vintage Coaster & Matchbox Decor */}
              <div className="desk-vintage-matchbox" aria-hidden="true">
                <div className="matchbox-label">
                  <span className="matchbox-star">★</span>
                  <span>महफ़िल माचिस • १९९०</span>
                  <span className="matchbox-star">★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theka Receipt Modal */}
      <HandwrittenReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
      />
    </section>
  )
})
