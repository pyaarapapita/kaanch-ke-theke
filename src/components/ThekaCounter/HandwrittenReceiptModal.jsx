import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Handwritten Theka Receipt Modal
 * A nostalgic parchment receipt detailing the midnight account of emotions, melodies, and poetry.
 */
export const HandwrittenReceiptModal = React.memo(function HandwrittenReceiptModal({
  isOpen,
  onClose
}) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="receipt-modal-backdrop"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-title"
        >
          <motion.div
            className="theka-receipt-parchment"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Top Close Pin Button */}
            <button
              type="button"
              className="receipt-close-btn"
              onClick={onClose}
              aria-label="पर्ची बंद करें"
              title="पर्ची बंद करें (Esc)"
            >
              ✕
            </button>

            {/* Weathered Top Jagged Tear Edge */}
            <div className="receipt-jagged-edge" aria-hidden="true" />

            {/* Receipt Header */}
            <div className="receipt-header">
              <span className="receipt-serial">पर्ची क्र. #1990-महफ़िल</span>
              <h3 id="receipt-title" className="receipt-theka-name">
                काँच के ठेके
              </h3>
              <p className="receipt-tagline">
                सदाबहार यादें, पुराने नग़मे और तन्हाई का मुकाम
              </p>
              <div className="receipt-divider" />
            </div>

            {/* Metadata Row */}
            <div className="receipt-meta-grid">
              <div>
                <span className="meta-label">तारीख़:</span>
                <span className="meta-val">आज की रात</span>
              </div>
              <div>
                <span className="meta-label">वक़्त:</span>
                <span className="meta-val">आधी रात (Midnight)</span>
              </div>
              <div>
                <span className="meta-label">ग्राहक:</span>
                <span className="meta-val">संगीत का मुसाफ़िर</span>
              </div>
              <div>
                <span className="meta-label">काउण्टर:</span>
                <span className="meta-val">लकड़ी की मेज़ #01</span>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="receipt-items-table" aria-label="ठेके का हिसाब-किताब">
              <thead>
                <tr>
                  <th scope="col">मद (Items)</th>
                  <th scope="col" className="text-center">मात्रा</th>
                  <th scope="col" className="text-right">मूल्य</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>90 के दशक के अमर नग़मे</td>
                  <td className="text-center">असीमित</td>
                  <td className="text-right">अनमोल</td>
                </tr>
                <tr>
                  <td>रफ़ी साहब के दर्द भरे तराने</td>
                  <td className="text-center">2 घूँट</td>
                  <td className="text-right">दिल से</td>
                </tr>
                <tr>
                  <td>जगजीत सिंह की खनकती ग़ज़ल</td>
                  <td className="text-center">भरपूर</td>
                  <td className="text-right">रूहानी</td>
                </tr>
                <tr>
                  <td>नुक्कड़ वाली कड़क चाय का सुरूर</td>
                  <td className="text-center">1 कुल्हड़</td>
                  <td className="text-right">मुफ़्त</td>
                </tr>
                <tr>
                  <td>बीती यादों की कसक व तन्हाई</td>
                  <td className="text-center">100%</td>
                  <td className="text-right">शामिल</td>
                </tr>
              </tbody>
            </table>

            {/* Total Section */}
            <div className="receipt-total-row">
              <span className="total-label">कुल योग (Grand Total):</span>
              <span className="total-val">दिल का सुकून 🍷</span>
            </div>

            {/* Poetic Couplet at bottom */}
            <div className="receipt-couplet-box">
              <p className="receipt-sher">
                “कल और आएंगे नग्मों की खिलती कलियां चुनने वाले,
                <br />
                मुझसे बेहतर कहने वाले, तुमसे बेहतर सुनने वाले।”
              </p>
              <span className="receipt-poet">— साहिर लुधियानवी</span>
            </div>

            {/* Authentic Red Stamp */}
            <div className="receipt-stamp-badge" aria-hidden="true">
              <div className="stamp-inner-ring">
                <span className="stamp-text-arc">काँच के ठेके</span>
                <strong className="stamp-verified">प्रमाणित</strong>
                <span className="stamp-sub">1990 • सदाबहार</span>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="receipt-action-center">
              <button
                type="button"
                className="theka-scene-btn receipt-fold-btn"
                onClick={onClose}
              >
                पर्ची जेब में रखें ✕
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})
