import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { playReelTick, playTapeClunk } from '../../utils/thekaAudio'
import { pulseScene } from '../../utils/scenePulse'
import { toDevanagari } from '../Home/homeContent'
import './RewindGame.css'

const TAU = Math.PI * 2
// Full turns of the pencil to rewind the whole tape.
const TURNS_TO_REWIND = 4
const TOTAL_ANGLE = TAU * TURNS_TO_REWIND
// One reel click for every sixth of a turn.
const TICK_ANGLE = TAU / 6
const KEY_STEP = 0.07
const AUTO_REWIND_MS = 1800
const TARGET_YEAR = 1990

// Cassette drawing, in SVG units.
const VIEW = { width: 360, height: 232 }
const LEFT_REEL = { x: 118, y: 118 }
const RIGHT_REEL = { x: 242, y: 118 }
const SPOOL_MIN = 17
const SPOOL_MAX = 41
const PENCIL_LENGTH = 92

function Reel({ center, tapeRadius, angle }) {
  return (
    <g>
      <circle cx={center.x} cy={center.y} r={tapeRadius} className="rewind-tape" />
      <g transform={`rotate(${angle} ${center.x} ${center.y})`}>
        <circle cx={center.x} cy={center.y} r="15" className="rewind-hub" />
        {[0, 60, 120, 180, 240, 300].map((turn) => (
          <rect
            key={turn}
            x={center.x - 1.6}
            y={center.y - 13}
            width="3.2"
            height="6"
            rx="1"
            className="rewind-hub-tooth"
            transform={`rotate(${turn} ${center.x} ${center.y})`}
          />
        ))}
        <circle cx={center.x} cy={center.y} r="5.5" className="rewind-hub-hole" />
      </g>
    </g>
  )
}

/**
 * Rewind a cassette with a pencil, the way it was done. Drag the pencil round the right
 * reel: the tape winds back, the year counter rolls down to 1990, and the tape then plays
 * a song picked at random. Arrow keys and a button do the same job without dragging.
 */
export const RewindGame = memo(function RewindGame({ songs, playlistId, onPlaySong }) {
  const [progress, setProgress] = useState(0)
  const [angle, setAngle] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [pickedSong, setPickedSong] = useState(null)

  const zoneRef = useRef(null)
  const state = useRef({ progress: 0, angle: 0, lastPointerAngle: 0, sinceTick: 0, frame: 0, autoFrame: 0, done: false, lastSongId: null })
  const [startYear] = useState(() => new Date().getFullYear())
  const hasSongs = songs.length > 0

  const flush = useCallback(() => {
    state.current.frame = 0
    setProgress(state.current.progress)
    setAngle(state.current.angle)
  }, [])

  const scheduleFlush = useCallback(() => {
    if (!state.current.frame) state.current.frame = requestAnimationFrame(flush)
  }, [flush])

  const finish = useCallback(() => {
    const current = state.current
    if (current.done) return
    current.done = true
    current.progress = 1
    cancelAnimationFrame(current.autoFrame)
    scheduleFlush()

    let choice = songs[Math.floor(Math.random() * songs.length)]
    if (songs.length > 1 && choice?.youtubeId === current.lastSongId) {
      choice = songs[(songs.indexOf(choice) + 1) % songs.length]
    }
    current.lastSongId = choice?.youtubeId ?? null
    setPickedSong(choice ?? null)
    setIsDragging(false)
    playTapeClunk()
    pulseScene(1)
  }, [songs, scheduleFlush])

  /** Turn the reels by an angle in radians. Either direction winds the tape back. */
  const turn = useCallback((delta) => {
    const current = state.current
    if (current.done) return
    current.angle += delta
    current.progress = Math.min(1, current.progress + Math.abs(delta) / TOTAL_ANGLE)
    current.sinceTick += Math.abs(delta)
    if (current.sinceTick >= TICK_ANGLE) {
      current.sinceTick = 0
      playReelTick()
    }
    if (current.progress >= 1) finish()
    else scheduleFlush()
  }, [finish, scheduleFlush])

  const pointerAngle = (event) => {
    const zone = zoneRef.current
    if (!zone) return 0
    const rect = zone.getBoundingClientRect()
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2))
  }

  const handlePointerDown = (event) => {
    if (state.current.done || !hasSongs) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    cancelAnimationFrame(state.current.autoFrame)
    zoneRef.current?.setPointerCapture?.(event.pointerId)
    state.current.lastPointerAngle = pointerAngle(event)
    setIsDragging(true)
  }

  const handlePointerMove = (event) => {
    if (!isDragging) return
    const next = pointerAngle(event)
    let delta = next - state.current.lastPointerAngle
    // Crossing the ±180° seam is a small move, not a full turn backwards.
    if (delta > Math.PI) delta -= TAU
    else if (delta < -Math.PI) delta += TAU
    state.current.lastPointerAngle = next
    turn(delta)
  }

  const handlePointerEnd = (event) => {
    zoneRef.current?.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)
  }

  const handleKeyDown = (event) => {
    if (state.current.done || !hasSongs) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      turn(TOTAL_ANGLE * KEY_STEP)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      turn(-TOTAL_ANGLE * KEY_STEP)
    } else if (event.key === 'End') {
      event.preventDefault()
      turn(TOTAL_ANGLE)
    }
  }

  // The button winds the rest of the tape on its own, for anyone who would rather not drag.
  const handleAutoRewind = () => {
    const current = state.current
    if (current.done || !hasSongs) return
    cancelAnimationFrame(current.autoFrame)
    const from = current.progress
    const duration = Math.max(400, AUTO_REWIND_MS * (1 - from))
    const startedAt = performance.now()
    const tick = (now) => {
      const elapsed = Math.min((now - startedAt) / duration, 1)
      const target = from + (1 - from) * elapsed
      // On the last frame, turn by a full tape so rounding can never leave it short.
      turn(elapsed >= 1 ? TOTAL_ANGLE : Math.max(0, target - current.progress) * TOTAL_ANGLE)
      if (!current.done) current.autoFrame = requestAnimationFrame(tick)
    }
    current.autoFrame = requestAnimationFrame(tick)
  }

  const handleReset = () => {
    const current = state.current
    cancelAnimationFrame(current.autoFrame)
    current.done = false
    current.progress = 0
    current.sinceTick = 0
    setPickedSong(null)
    scheduleFlush()
  }

  const handlePlay = () => {
    if (pickedSong?.youtubeId) onPlaySong(pickedSong.youtubeId, playlistId)
  }

  useEffect(() => {
    const current = state.current
    return () => {
      cancelAnimationFrame(current.frame)
      cancelAnimationFrame(current.autoFrame)
    }
  }, [])

  const isDone = progress >= 1
  const year = Math.round(startYear - (startYear - TARGET_YEAR) * progress)
  const degrees = (angle * 180) / Math.PI
  const leftRadius = SPOOL_MIN + (SPOOL_MAX - SPOOL_MIN) * progress
  const rightRadius = SPOOL_MAX - (SPOOL_MAX - SPOOL_MIN) * progress
  const percent = Math.round(progress * 100)

  return (
    <div className={`rewind ${isDone ? 'is-done' : ''} ${isDragging ? 'is-dragging' : ''}`}>
      <div className="rewind-deck">
        <svg className="rewind-cassette" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} role="img" aria-label="मिक्स-टेप कैसेट">
          <defs>
            <linearGradient id="rewind-shell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2A1E14" />
              <stop offset="1" stopColor="#120D09" />
            </linearGradient>
            <linearGradient id="rewind-label" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F1E2C3" />
              <stop offset="1" stopColor="#DCC79F" />
            </linearGradient>
            <linearGradient id="rewind-pencil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#D4A35F" />
              <stop offset="0.5" stopColor="#B8894A" />
              <stop offset="1" stopColor="#8A6230" />
            </linearGradient>
          </defs>

          <rect x="6" y="6" width="348" height="220" rx="14" className="rewind-shell" fill="url(#rewind-shell)" />
          <rect x="22" y="20" width="316" height="148" rx="8" fill="url(#rewind-label)" />
          <rect x="22" y="20" width="316" height="20" rx="8" className="rewind-label-band" />
          <text x="34" y="34" className="rewind-label-small">KAANCH KE THEKE</text>
          <text x="326" y="34" textAnchor="end" className="rewind-label-small">SIDE A • 90 MIN</text>
          <text x="180" y="62" textAnchor="middle" className="rewind-label-title">मिक्स-टेप • महफ़िल</text>
          <line x1="60" y1="70" x2="300" y2="70" className="rewind-label-rule" />

          <rect x="64" y="80" width="232" height="76" rx="10" className="rewind-window" />
          <Reel center={LEFT_REEL} tapeRadius={leftRadius} angle={degrees} />
          <Reel center={RIGHT_REEL} tapeRadius={rightRadius} angle={degrees} />
          <path
            d={`M ${LEFT_REEL.x + leftRadius} ${LEFT_REEL.y} Q 180 ${LEFT_REEL.y + 24} ${RIGHT_REEL.x - rightRadius} ${RIGHT_REEL.y}`}
            className="rewind-tape-bridge"
          />
          <rect x="64" y="80" width="232" height="76" rx="10" className="rewind-window-glass" />

          <path d="M 70 226 L 86 180 H 274 L 290 226 Z" className="rewind-foot" />
          {[122, 162, 198, 238].map((x) => (
            <circle key={x} cx={x} cy="204" r="5" className="rewind-foot-hole" />
          ))}
          {[[20, 18], [340, 18], [20, 214], [340, 214]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" className="rewind-screw" />
          ))}

          {/* The pencil is pushed into the right reel and turns with it. */}
          <g className="rewind-pencil" transform={`rotate(${degrees - 38} ${RIGHT_REEL.x} ${RIGHT_REEL.y})`}>
            <rect x={RIGHT_REEL.x - 4} y={RIGHT_REEL.y - 4.5} width={PENCIL_LENGTH} height="9" rx="1.5" fill="url(#rewind-pencil)" />
            <rect x={RIGHT_REEL.x + PENCIL_LENGTH - 16} y={RIGHT_REEL.y - 4.5} width="5" height="9" className="rewind-pencil-ferrule" />
            <rect x={RIGHT_REEL.x + PENCIL_LENGTH - 11} y={RIGHT_REEL.y - 4.5} width="11" height="9" rx="3" className="rewind-pencil-eraser" />
            <circle cx={RIGHT_REEL.x} cy={RIGHT_REEL.y} r="4.2" className="rewind-pencil-tip" />
          </g>
        </svg>

        {/* The drag target sits over the right reel. Only this circle blocks page scrolling. */}
        <div
          ref={zoneRef}
          className="rewind-zone"
          role="slider"
          tabIndex={hasSongs && !isDone ? 0 : -1}
          aria-label="पेंसिल घुमाकर कैसेट की रील लपेटें"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}% लपेटा गया, साल ${year}`}
          aria-disabled={!hasSongs || isDone}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleKeyDown}
        >
          {!isDone && progress === 0 && <span className="rewind-zone-hint" aria-hidden="true" />}
        </div>
      </div>

      <div className="rewind-panel">
        <div className="rewind-counter" aria-hidden="true">
          <span className="rewind-counter-label">साल</span>
          <span className="rewind-counter-digits">
            {String(year).split('').map((digit, position) => (
              <span key={position} className="rewind-counter-digit">{digit}</span>
            ))}
          </span>
          <span className="rewind-counter-bar">
            <span className="rewind-counter-fill" style={{ transform: `scaleX(${progress})` }} />
          </span>
        </div>

        <div className="rewind-result" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {isDone && pickedSong ? (
              <motion.div
                key={pickedSong.youtubeId || pickedSong.id}
                className="rewind-song"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="rewind-song-label">टेप {toDevanagari(TARGET_YEAR)} पर रुकी — आपका नग़मा</span>
                <strong className="rewind-song-title">{pickedSong.title}</strong>
                <span className="rewind-song-artist">{pickedSong.artist}</span>
                <div className="rewind-song-actions">
                  <button type="button" className="editorial-action-link" onClick={handlePlay}>
                    बजाएँ
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button type="button" className="text-link" onClick={handleReset}>
                    फिर से लपेटें ↺
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="prompt"
                className="rewind-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="rewind-prompt-text">
                  {hasSongs
                    ? 'पेंसिल पकड़िए और दाईं रील के चारों ओर घुमाइए। रील पूरी लपेटते ही टेप एक नग़मा चुन लेगी।'
                    : 'इस टेप में अभी नग़मे भरे जा रहे हैं। थोड़ी देर में लौटिए।'}
                </p>
                {hasSongs && (
                  <button type="button" className="text-link" onClick={handleAutoRewind}>
                    पेंसिल नहीं है? बटन से लपेटें →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
})
