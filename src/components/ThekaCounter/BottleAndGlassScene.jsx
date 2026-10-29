import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { playCorkPop, playPourSound, playGlassClink } from '../../utils/thekaAudio'

/**
 * Signature Bottle and Glass Interactive & Scroll-Driven Scene
 * Features:
 * 1. Tap to pour cinematic animation with authentic sounds (cork pop, liquid stream, glass clink).
 * 2. Scroll-driven liquid filling as visitor moves through the section.
 * 3. Custom crafted scalable SVG artwork with amber gradients, specular glass bevels, and fluid meniscus.
 * 4. Replay controls and accessible keyboard operation.
 */
export const BottleAndGlassScene = React.memo(function BottleAndGlassScene({
  onGlassFilled,
  activePlaylistTitle = '९०s की बोतल 🍾'
}) {
  // Animation states: 'idle' | 'popping' | 'tilting' | 'pouring' | 'returning' | 'filled'
  const [pourState, setPourState] = useState('idle')
  const [clickFillPercent, setClickFillPercent] = useState(0)
  const isPouringActive = pourState !== 'idle' && pourState !== 'filled'
  const isFilled = pourState === 'filled'

  const sectionRef = useRef(null)

  // Scroll-driven liquid progress (0 -> 1)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center']
  })

  // Smooth scroll-driven fill percentage (0 to 75%)
  const scrollFillHeight = useTransform(scrollYProgress, [0.15, 0.95], [5, 80])
  const [scrollFillValue, setScrollFillValue] = useState(10)

  useEffect(() => {
    const unsubscribe = scrollFillHeight.on('change', (latest) => {
      // Only drive liquid from scroll if user isn't in manual click-pour mode
      if (pourState === 'idle') {
        setScrollFillValue(Math.max(5, Math.min(80, latest)))
      }
    })
    return () => unsubscribe()
  }, [scrollFillHeight, pourState])

  // Final effective liquid height percentage in the glass (0% to 100%)
  const effectiveLiquidPercent = isFilled
    ? 90
    : isPouringActive
    ? clickFillPercent
    : scrollFillValue

  // Clean animation sequence for tapping the bottle
  const handleTapBottle = useCallback(() => {
    if (isPouringActive) return

    // If already filled, replay smoothly
    if (isFilled) {
      setPourState('idle')
      setClickFillPercent(0)
      return
    }

    setPourState('popping')
    playCorkPop()

    // Step 1: Cork pop -> Bottle tilts towards glass
    const tiltTimer = setTimeout(() => {
      setPourState('tilting')
    }, 350)

    // Step 2: Start liquid stream & fill glass
    const pourTimer = setTimeout(() => {
      setPourState('pouring')
      playPourSound(2.2)

      // Gradually fill glass over 2 seconds
      let current = 15
      const fillInterval = setInterval(() => {
        current += 5
        setClickFillPercent(Math.min(90, current))
        if (current >= 90) {
          clearInterval(fillInterval)
        }
      }, 110)
    }, 750)

    // Step 3: Bottle returns upright
    const returnTimer = setTimeout(() => {
      setPourState('returning')
    }, 2800)

    // Step 4: Final filled state with clink sound
    const filledTimer = setTimeout(() => {
      setPourState('filled')
      setClickFillPercent(90)
      playGlassClink()
      if (onGlassFilled) {
        onGlassFilled()
      }
    }, 3400)

    return () => {
      clearTimeout(tiltTimer)
      clearTimeout(pourTimer)
      clearTimeout(returnTimer)
      clearTimeout(filledTimer)
    }
  }, [isPouringActive, isFilled, onGlassFilled])

  // Replay handler
  const handleReset = useCallback(() => {
    setPourState('idle')
    setClickFillPercent(0)
  }, [])

  return (
    <div
      ref={sectionRef}
      className="bottle-glass-scene-wrapper"
      role="region"
      aria-label="काँच के ठेके — बोतल व जाम इंटरेक्शन"
    >
      {/* Scene Header & Instructions */}
      <div className="scene-instruction-header">
        <div className="scene-status-pill">
          <span className="pulse-amber-dot" aria-hidden="true" />
          <span className="scene-status-text">
            {isFilled
              ? 'जाम तैयार है • Sip & Listen'
              : isPouringActive
              ? 'अमृत छलक रहा है... • Pouring'
              : 'काउण्टर पर जाम • Tap or Scroll'}
          </span>
        </div>

        <h3 className="scene-interactive-heading">
          {isFilled ? 'शाम का पहला घूँट, यादों का सुरूर' : 'बोतल पर टैप करें या स्क्रॉल से भरें'}
        </h3>
        <p className="scene-interactive-sub">
          लकड़ी के पुराने काउण्टर पर रखी विंटेज बोतल और नक्काशीदार काँच का गिलास।
        </p>
      </div>

      {/* Main SVG Cinematic Stage */}
      <div className="svg-stage-container">
        <svg
          viewBox="0 0 860 490"
          className="theka-counter-svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            {/* Ambient Counter Glow */}
            <radialGradient id="counterGlow" cx="48%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#FFAA33" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#8A420D" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0D0A08" stopOpacity="0" />
            </radialGradient>

            {/* Teak Wood Plank Gradient */}
            <linearGradient id="teakCounterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3A2417" />
              <stop offset="4%" stopColor="#513320" />
              <stop offset="15%" stopColor="#2F1C11" />
              <stop offset="60%" stopColor="#22140B" />
              <stop offset="100%" stopColor="#140B06" />
            </linearGradient>

            {/* Amber Bottle Glass Gradient */}
            <linearGradient id="bottleGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2D1405" stopOpacity="0.95" />
              <stop offset="12%" stopColor="#87440E" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#E5942B" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#692906" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#3F1703" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#1B0A02" stopOpacity="0.98" />
            </linearGradient>

            {/* Vintage Paper Bottle Label */}
            <linearGradient id="parchmentLabelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF4DE" />
              <stop offset="50%" stopColor="#EFE1C6" />
              <stop offset="100%" stopColor="#D8C3A0" />
            </linearGradient>

            {/* Amber Spirits Liquid Gradient */}
            <linearGradient id="amberLiquidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#561E05" />
              <stop offset="35%" stopColor="#9C4B0A" />
              <stop offset="70%" stopColor="#D98823" />
              <stop offset="100%" stopColor="#FFCE6E" />
            </linearGradient>

            {/* Liquid Stream Gradient */}
            <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE08A" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#E08B1F" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#8F3C08" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFDA73" stopOpacity="0.95" />
            </linearGradient>

            {/* Glass Specular Bevels */}
            <linearGradient id="glassSpecularGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
            </linearGradient>

            {/* Brass Coaster Rim Gradient */}
            <linearGradient id="brassCoasterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6C4E1A" />
              <stop offset="30%" stopColor="#E6BC6B" />
              <stop offset="70%" stopColor="#9A7029" />
              <stop offset="100%" stopColor="#503710" />
            </linearGradient>

            {/* Glass Liquid Clip Path */}
            <clipPath id="glassInteriorClip">
              <polygon points="502,230 608,230 598,375 512,375" />
            </clipPath>
          </defs>

          {/* Background Ambient Radial Glow on Counter */}
          <rect x="0" y="0" width="860" height="490" fill="url(#counterGlow)" />

          {/* Wooden Theka Counter Base */}
          <g className="wooden-counter-layer">
            {/* Counter Surface */}
            <polygon
              points="0,375 860,375 860,490 0,490"
              fill="url(#teakCounterGrad)"
            />
            {/* Top Bevel Highlight of Counter */}
            <line
              x1="0"
              y1="375"
              x2="860"
              y2="375"
              stroke="#D4AF76"
              strokeOpacity="0.38"
              strokeWidth="2.5"
            />
            {/* Subtle wood grain lines */}
            <line x1="0" y1="395" x2="860" y2="395" stroke="#170D07" strokeWidth="1.5" />
            <line x1="0" y1="425" x2="860" y2="425" stroke="#170D07" strokeWidth="1" />
            <line x1="0" y1="455" x2="860" y2="455" stroke="#150B06" strokeWidth="1.2" />

            {/* Counter Specular Reflections underneath bottle & glass */}
            <ellipse cx="270" cy="378" rx="85" ry="12" fill="#000000" fillOpacity="0.65" />
            <ellipse cx="555" cy="378" rx="65" ry="10" fill="#000000" fillOpacity="0.6" />
            <ellipse cx="555" cy="378" rx="45" ry="6" fill="#D48924" fillOpacity="0.18" />
          </g>

          {/* ===============================================================
              GLASS & COASTER LAYER (Right Side of Counter)
              =============================================================== */}
          <g className="glass-assembly">
            {/* Heavy Brass Coaster */}
            <ellipse cx="555" cy="380" rx="64" ry="14" fill="url(#brassCoasterGrad)" />
            <ellipse cx="555" cy="378" rx="58" ry="11" fill="#24170D" stroke="#9A7029" strokeWidth="1" />
            <ellipse cx="555" cy="377" rx="54" ry="9" fill="#180F08" />

            {/* Glass Drop Shadow */}
            <ellipse cx="555" cy="376" rx="46" ry="8" fill="#000000" fillOpacity="0.45" />

            {/* Liquid inside the glass (clipped to glass interior polygon) */}
            <g clipPath="url(#glassInteriorClip)">
              {/* Back liquid volume rising with effectiveLiquidPercent */}
              <rect
                x="495"
                y={375 - (145 * (effectiveLiquidPercent / 100))}
                width="120"
                height={145 * (effectiveLiquidPercent / 100) + 10}
                fill="url(#amberLiquidGrad)"
                style={{
                  transition: isPouringActive ? 'none' : 'y 0.25s ease-out, height 0.25s ease-out'
                }}
              />

              {/* Surface Meniscus Ellipse with golden glint */}
              {effectiveLiquidPercent > 2 && (
                <ellipse
                  cx="555"
                  cy={375 - (145 * (effectiveLiquidPercent / 100))}
                  rx={46 - (effectiveLiquidPercent * 0.08)}
                  ry="6"
                  fill="#FFE699"
                  fillOpacity="0.85"
                />
              )}

              {/* Rising micro-bubbles in liquid */}
              {effectiveLiquidPercent > 25 && (
                <g className="liquid-bubbles" fill="#FFEBB3" fillOpacity="0.6">
                  <circle cx="538" cy={360 - (effectiveLiquidPercent * 0.6)} r="1.8" />
                  <circle cx="565" cy={365 - (effectiveLiquidPercent * 0.8)} r="1.4" />
                  <circle cx="548" cy={370 - (effectiveLiquidPercent * 0.4)} r="2.2" />
                  <circle cx="572" cy={355 - (effectiveLiquidPercent * 0.7)} r="1.2" />
                </g>
              )}
            </g>

            {/* Glass Tumbler Body (Faceted Rocks Glass) */}
            {/* Outer Glass Wall */}
            <polygon
              points="498,225 612,225 601,375 509,375"
              fill="url(#glassSpecularGrad)"
              stroke="#D4AF76"
              strokeWidth="1.2"
              strokeOpacity="0.55"
            />

            {/* Thick Heavy Glass Base */}
            <polygon
              points="509,360 601,360 598,375 512,375"
              fill="#FFFFFF"
              fillOpacity="0.12"
              stroke="#E8D7B5"
              strokeOpacity="0.3"
              strokeWidth="1"
            />

            {/* Faceted Cut Lines on Glass Walls */}
            <line x1="524" y1="230" x2="528" y2="360" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />
            <line x1="544" y1="230" x2="545" y2="360" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1" />
            <line x1="566" y1="230" x2="565" y2="360" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1" />
            <line x1="586" y1="230" x2="582" y2="360" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />

            {/* Rim Highlight */}
            <ellipse
              cx="555"
              cy="225"
              rx="57"
              ry="7"
              fill="none"
              stroke="#FFF8E7"
              strokeWidth="1.8"
              strokeOpacity="0.75"
            />

            {/* Ambient Glass Glow when filled */}
            {isFilled && (
              <ellipse
                cx="555"
                cy="300"
                rx="42"
                ry="50"
                fill="#FFAA33"
                fillOpacity="0.12"
                filter="blur(10px)"
              />
            )}
          </g>

          {/* ===============================================================
              LIQUID POUR STREAM (Active during 'pouring' state)
              =============================================================== */}
          {pourState === 'pouring' && (
            <g className="pour-stream-group">
              {/* Main Golden Fluid Stream from tilted bottle neck to glass */}
              <motion.path
                d="M 378,212 C 430,225 490,240 545,260 L 549,260 C 495,236 435,218 382,207 Z"
                fill="url(#streamGrad)"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />

              {/* Stream highlight core */}
              <path
                d="M 380,209 Q 460,228 547,260"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.8"
                fill="none"
              />

              {/* Splash splash ripple ring in glass */}
              <ellipse
                cx="547"
                cy="262"
                rx="14"
                ry="4"
                fill="#FFF1C2"
                fillOpacity="0.85"
              />
            </g>
          )}

          {/* ===============================================================
              BOTTLE ASSEMBLY (Left Side of Counter)
              Clickable / Tappable with realistic tilt animation
              =============================================================== */}
          <motion.g
            className="bottle-group-motion"
            style={{ originX: '270px', originY: '360px', cursor: 'pointer' }}
            animate={
              pourState === 'tilting' || pourState === 'pouring'
                ? { rotate: -52, x: 75, y: -45 }
                : pourState === 'returning'
                ? { rotate: 0, x: 0, y: 0 }
                : { rotate: 0, x: 0, y: 0 }
            }
            transition={{
              duration: pourState === 'tilting' ? 0.65 : pourState === 'returning' ? 0.7 : 0.4,
              ease: [0.25, 1, 0.5, 1]
            }}
            onClick={handleTapBottle}
          >
            {/* Bottle Glass Body */}
            {/* Main Chamber */}
            <rect
              x="220"
              y="180"
              width="100"
              height="195"
              rx="16"
              fill="url(#bottleGlassGrad)"
              stroke="#D4AF76"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />

            {/* Bottle Shoulder Curve */}
            <path
              d="M 220,195 Q 220,150 255,140 L 285,140 Q 320,150 320,195 Z"
              fill="url(#bottleGlassGrad)"
              stroke="#D4AF76"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />

            {/* Bottle Neck */}
            <rect
              x="256"
              y="90"
              width="28"
              height="55"
              fill="url(#bottleGlassGrad)"
              stroke="#D4AF76"
              strokeWidth="1"
              strokeOpacity="0.4"
            />

            {/* Bottle Spout Collar Rim */}
            <rect
              x="252"
              y="85"
              width="36"
              height="10"
              rx="3"
              fill="#7A390B"
              stroke="#E8D7B5"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />

            {/* Vertical Specular Glass Highlight */}
            <line
              x1="234"
              y1="190"
              x2="234"
              y2="365"
              stroke="#FFFFFF"
              strokeOpacity="0.32"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="262"
              y1="95"
              x2="262"
              y2="135"
              stroke="#FFFFFF"
              strokeOpacity="0.35"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Vintage Theka Paper Label */}
            <g className="bottle-label-artwork">
              <rect
                x="228"
                y="225"
                width="84"
                height="115"
                rx="6"
                fill="url(#parchmentLabelGrad)"
                stroke="#6B421E"
                strokeWidth="1.5"
              />
              {/* Inner Decorative Border */}
              <rect
                x="233"
                y="230"
                width="74"
                height="105"
                rx="4"
                fill="none"
                stroke="#A36B31"
                strokeWidth="1"
                strokeDasharray="3 1.5"
              />

              {/* Hindi Brand Title */}
              <text
                x="270"
                y="254"
                textAnchor="middle"
                fill="#2B1608"
                fontFamily="inherit"
                fontWeight="800"
                fontSize="12.5"
                letterSpacing="0.4"
              >
                काँच के ठेके
              </text>

              {/* Gold Ornament Divider */}
              <line x1="242" y1="262" x2="298" y2="262" stroke="#8C4F18" strokeWidth="1" />
              <polygon points="270,259 273,262 270,265 267,262" fill="#8C4F18" />

              {/* Vintage Batch & Tagline */}
              <text
                x="270"
                y="276"
                textAnchor="middle"
                fill="#613612"
                fontFamily="Georgia, serif"
                fontWeight="700"
                fontSize="7.5"
                letterSpacing="0.8"
              >
                SPECIAL VINTAGE 1990
              </text>

              <text
                x="270"
                y="294"
                textAnchor="middle"
                fill="#3A1C05"
                fontFamily="inherit"
                fontWeight="600"
                fontSize="8.5"
              >
                सदाबहार महफ़िल
              </text>

              {/* Seal Stamp */}
              <rect x="254" y="306" width="32" height="18" rx="2" fill="#8A261E" fillOpacity="0.85" />
              <text
                x="270"
                y="318"
                textAnchor="middle"
                fill="#FFF4DE"
                fontFamily="inherit"
                fontWeight="700"
                fontSize="6.8"
              >
                प्रमाणित
              </text>
            </g>

            {/* Bottle Cap (Pops off during 'popping' animation) */}
            <AnimatePresence>
              {pourState === 'idle' ? (
                <g className="bottle-cap">
                  <rect
                    x="254"
                    y="76"
                    width="32"
                    height="12"
                    rx="3"
                    fill="url(#brassCoasterGrad)"
                    stroke="#D4AF76"
                    strokeWidth="1"
                  />
                  <line x1="256" y1="80" x2="284" y2="80" stroke="#FFF" strokeOpacity="0.4" />
                </g>
              ) : pourState === 'popping' ? (
                <motion.g
                  className="bottle-cap-popping"
                  initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
                  animate={{ y: -65, x: 45, rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <rect
                    x="254"
                    y="76"
                    width="32"
                    height="12"
                    rx="3"
                    fill="url(#brassCoasterGrad)"
                  />
                </motion.g>
              ) : null}
            </AnimatePresence>
          </motion.g>
        </svg>

        {/* Tactile Tap Hint Badge on the Bottle */}
        {pourState === 'idle' && (
          <motion.button
            type="button"
            className="bottle-tap-hint-btn"
            onClick={handleTapBottle}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            aria-label="बोतल खोलें और जाम भरें"
          >
            <span className="tap-hand-icon" aria-hidden="true">👆</span>
            <span className="tap-hint-text">बोतल पर टैप करें (Tap to Pour)</span>
          </motion.button>
        )}
      </div>

      {/* Post-Pour Interaction Controls */}
      <div className="scene-footer-controls">
        <div className="scene-current-vibe">
          <span className="vibe-label">वर्तमान महफ़िल:</span>
          <strong className="vibe-name">{activePlaylistTitle}</strong>
        </div>

        <div className="scene-action-buttons">
          {isFilled ? (
            <button
              type="button"
              className="theka-scene-btn replay-btn"
              onClick={handleReset}
              aria-label="जाम दोबारा खाली करें और फिर से भरें"
            >
              <span className="btn-icon" aria-hidden="true">↺</span>
              <span>फिर से भरें (Replay Pour)</span>
            </button>
          ) : (
            <button
              type="button"
              className="theka-scene-btn pour-action-btn"
              onClick={handleTapBottle}
              disabled={isPouringActive}
            >
              <span className="btn-icon" aria-hidden="true">🍾</span>
              <span>
                {isPouringActive ? 'जाम भर रहा है...' : 'बोतल खोलें (Open & Pour)'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
