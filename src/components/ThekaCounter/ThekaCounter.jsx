import React, { useState, useCallback, useEffect } from 'react'
import { ThekaLantern } from './ThekaLantern'
import { HandwrittenReceiptModal } from './HandwrittenReceiptModal'

/**
 * ThekaCounter — The Physical Vintage Counter Experience
 * Cleanly focused on:
 * - Atmospheric Brass Kerosene Lantern with ambient lighting adjustment
 * - Authentic Handwritten Theka Receipt & Ledger Slip
 * - Vintage counter memorabilia & nostalgia
 */
export const ThekaCounter = React.memo(function ThekaCounter() {
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
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-lantern-level', level)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-lantern-level', lanternBrightness)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-lantern-level')
      }
    }
  }, [lanternBrightness])

  return (
    <section
      id="theka-counter-experience"
      className={`theka-counter-section lantern-ambient-${lanternBrightness}`}
      aria-label="ठेके में एक शाम — लकड़ी का काउण्टर"
    >
      <div className="theka-counter-container">
        {/* Experience Header */}
        <div className="counter-narrative-header">
          <div className="editorial-badge-row">
            <span className="editorial-badge">ठेके में एक शाम • The Counter Experience</span>
            <span className="editorial-meta">1990 की रात, लकड़ी की मेज़ व पुरानी यादें</span>
          </div>
          <h2 className="editorial-title counter-main-title">
            काउण्टर की अमानत — यादें, पर्ची और लालटेन की लौ
          </h2>
          <p className="editorial-desc counter-main-desc">
            यह केवल एक वेबसाइट नहीं, बल्कि रात के पहर का वही चिर-परिचित ठेका है। काउण्टर पर रखी हर चीज़ से एक याद जुड़ी है—पीतल की लालटेन से माहौल की गर्माहट बदलिए और पुराने हिसाब की पर्ची देखिए।
          </p>
        </div>

        {/* Counter Stage Top Bar: Objects Quick Bar */}
        <div className="counter-objects-bar">
          <div className="counter-objects-hint">
            <span className="objects-icon" aria-hidden="true">📜</span>
            <span className="objects-label">काउण्टर की अमानतें (Desk Keepsakes):</span>
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
          </div>
        </div>

        {/* Focused Keepsakes Showcase (Lantern + Handwritten Slip + Matchbox) */}
        <div className="counter-memorabilia-showcase">
          <div className="shelf-item-header">
            <span className="shelf-badge">स्मृतियाँ व रौशनी</span>
            <h3 className="shelf-title">मेज़ की अमानत (Counter Keepsakes)</h3>
          </div>

          <div className="memorabilia-desk-card">
            {/* Interactive Lantern */}
            <div className="desk-lantern-wrapper">
              <ThekaLantern onFlameChange={handleFlameChange} />
              <div className="lantern-instruction-text">
                <strong>पीतल की लालटेन</strong>
                <span>क्लिक करके लौ की तीव्रता बदलें (धीमी / मध्यम / तेज़)</span>
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
                  “2 घूँट पुराने नग़मे, भरपूर यादों का सुरूर...”
                </p>
                <span className="receipt-tap-cta">पूरी पर्ची पढ़ें →</span>
              </div>
            </div>

            {/* Vintage Coaster & Matchbox Decor */}
            <div className="desk-vintage-matchbox" aria-hidden="true">
              <div className="matchbox-label">
                <span className="matchbox-star">★</span>
                <span>महफ़िल माचिस • 1990</span>
                <span className="matchbox-star">★</span>
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
