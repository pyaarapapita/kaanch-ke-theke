import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { playRadioStatic } from '../../utils/thekaAudio'

const RADIO_STATIONS = [
  {
    id: 'station-90s',
    frequency: '93.5 FM',
    name: 'विविध भारती • छायागीत',
    needleX: 25, // percentage across dial
    desc: 'अमीन सयानी की खनकती आवाज़ और बिनाका गीतमाला के सदाबहार नग़मे।',
    playlistId: '90s',
    badge: 'अब सक्रिय • LIVE'
  },
  {
    id: 'station-ghazal',
    frequency: '102.6 AM',
    name: 'रेडियो सीलोन • महफ़िल-ए-ग़ज़ल',
    needleX: 58,
    desc: 'काँच के गिलासों की खनक, जगजीत सिंह का सोज़ और आधी रात की ख़ामोशी।',
    playlistId: 'mahfil',
    badge: 'ग़ज़ल बैठक'
  },
  {
    id: 'station-rain',
    frequency: '531 MW',
    name: 'आकाशवाणी • भीगी यादें',
    needleX: 85,
    desc: 'रिमझिम बारिश की टिप-टिप और खिड़की पर चाय के साथ बजती किशोर दा की धुन।',
    playlistId: 'barish-aur-yaadein',
    badge: 'मानसून स्पेशल'
  }
]

/**
 * Vintage Transistor Radio Component
 * Offers interactive frequency dial tuning, analog radio sounds, and seamless playlist selection.
 */
export const VintageRadio = React.memo(function VintageRadio({
  currentPlaylistId,
  onSelectStation
}) {
  const [selectedStationIndex, setSelectedStationIndex] = useState(0)
  const activeStation = RADIO_STATIONS[selectedStationIndex]

  const handleTuneStation = useCallback(
    (index) => {
      if (index === selectedStationIndex) return
      playRadioStatic()
      setSelectedStationIndex(index)
    },
    [selectedStationIndex]
  )

  const handleApplyStation = useCallback(() => {
    if (onSelectStation && activeStation.playlistId) {
      onSelectStation(activeStation.playlistId)
    }
  }, [onSelectStation, activeStation])

  return (
    <div
      className="vintage-radio-cabinet"
      role="region"
      aria-label="विंटेज मुसाफ़िर ट्रांजिस्टर रेडियो"
    >
      {/* Radio Cabinet Top Antenna & Handle */}
      <div className="radio-top-handle" aria-hidden="true">
        <span className="handle-bar" />
        <span className="radio-antenna" />
      </div>

      {/* Main Wood Body */}
      <div className="radio-wooden-body">
        {/* Brand Plaque */}
        <div className="radio-brand-plate">
          <span className="plate-screw" />
          <strong className="plate-brand-name">मुसाफ़िर ट्रांजिस्टर • १९९०</strong>
          <span className="plate-screw" />
        </div>

        {/* Illuminated Analog Tuning Dial */}
        <div className="radio-tuning-dial-panel" aria-label="रेडियो ट्यूनिंग डायल">
          <div className="frequency-track">
            <span className="band-mark">FM 88 ... 93.5 ... 98 ... 108</span>
            <span className="band-mark">MW 531 ... 800 ... 1200 ... 1600</span>
          </div>

          {/* Glowing Red Frequency Needle */}
          <motion.div
            className="radio-tuning-needle"
            animate={{ left: `${activeStation.needleX}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            aria-hidden="true"
          />

          {/* Dial Glass Glint */}
          <div className="dial-glass-glint" aria-hidden="true" />
        </div>

        {/* Radio Speaker Grille & Station Selector */}
        <div className="radio-lower-row">
          {/* Vintage Fabric Speaker Mesh */}
          <div className="vintage-speaker-mesh" aria-hidden="true">
            <div className="speaker-cloth-pattern" />
          </div>

          {/* Tuning Knobs & Station Buttons */}
          <div className="radio-controls-stack">
            <div className="station-pills-column" role="group" aria-label="स्टेशन चुनें">
              {RADIO_STATIONS.map((stn, idx) => {
                const isSelected = selectedStationIndex === idx
                return (
                  <button
                    key={stn.id}
                    type="button"
                    className={`radio-station-btn ${isSelected ? 'is-tuned' : ''}`}
                    onClick={() => handleTuneStation(idx)}
                    aria-pressed={isSelected}
                  >
                    <span className="stn-freq">{stn.frequency}</span>
                    <span className="stn-name">{stn.name.split('•')[0]}</span>
                    {isSelected && <span className="stn-glow-dot" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Current Tuned Frequency Info & Play Action */}
        <div className="radio-tuned-display">
          <div className="tuned-text-group">
            <div className="tuned-title-row">
              <span className="tuned-badge">{activeStation.badge}</span>
              <strong className="tuned-channel-title">{activeStation.name}</strong>
            </div>
            <p className="tuned-desc">{activeStation.desc}</p>
          </div>

          <button
            type="button"
            className="theka-scene-btn radio-tune-action-btn"
            onClick={handleApplyStation}
          >
            {currentPlaylistId === activeStation.playlistId ? (
              <>
                <span className="btn-icon">📻</span>
                <span>यह स्टेशन बज रहा है</span>
              </>
            ) : (
              <>
                <span className="btn-icon">▶</span>
                <span>यह महफ़िल ट्यून करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})
