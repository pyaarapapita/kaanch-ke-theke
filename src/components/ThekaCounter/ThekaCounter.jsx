import React, { useState, useCallback, useEffect } from 'react'
import { ThekaLantern } from './ThekaLantern'
import { HandwrittenReceiptModal } from './HandwrittenReceiptModal'

/**
 * The things left on the counter: a brass lantern whose flame also lights the 3D room
 * (through data-lantern-level on <html>), the night's receipt, and a matchbox.
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

  useEffect(() => {
    document.documentElement.setAttribute('data-lantern-level', lanternBrightness)
    return () => {
      document.documentElement.removeAttribute('data-lantern-level')
    }
  }, [lanternBrightness])

  return (
    <div className={`counter-desk lantern-ambient-${lanternBrightness}`}>
      <div className="counter-desk-glow" aria-hidden="true" />

      <div className="counter-desk-items">
        <div className="counter-lantern">
          <ThekaLantern onFlameChange={setLanternBrightness} />
        </div>

        <div className="counter-papers">
          <button
            type="button"
            className="desk-physical-receipt"
            onClick={handleOpenReceipt}
            aria-haspopup="dialog"
            aria-label="काउण्टर पर रखी हिसाब की पर्ची पढ़ें"
          >
            <span className="receipt-paper-header">
              <span className="receipt-mini-stamp">प्रमाणित</span>
              <strong className="receipt-mini-title">काँच के ठेके • पर्ची</strong>
            </span>
            <span className="receipt-mini-quote">
              “2 घूँट पुराने नग़मे, भरपूर यादों का सुरूर...”
            </span>
            <span className="receipt-tap-cta">पूरी पर्ची पढ़ें →</span>
          </button>

          <div className="desk-vintage-matchbox" aria-hidden="true">
            <span className="matchbox-star">★</span>
            <span>महफ़िल माचिस • 1990</span>
            <span className="matchbox-star">★</span>
          </div>
        </div>
      </div>

      <div className="counter-desk-ledge" aria-hidden="true" />
      <p className="counter-desk-hint">लालटेन छूकर लौ बदलिए — कमरे की रौशनी साथ बदलेगी।</p>

      <HandwrittenReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
      />
    </div>
  )
})
