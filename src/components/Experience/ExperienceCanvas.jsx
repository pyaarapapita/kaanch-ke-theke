import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { VinylRig, MODEL_PATH } from './VinylRig'
import { StudioEnvironment } from './StudioEnvironment'
import { DustField } from './DustField'
import { StudioRoom, ROOM_PATH } from './StudioRoom'
import { Cassettes, CASSETTES_PATH } from './Cassettes'
import { createScrollTimeline, countScrollTriggers } from './scrollTimeline'
import { getLayoutName, INITIAL_CAMERA, LAYOUTS } from './sceneConfig'
import { TIER_CONFIG } from './deviceTier'

// Keep drawing this long after the last change, so damped values can settle.
const SETTLE_MS = 400
// Frame budget: under about 22 FPS lower the resolution. If it is still under about 12 FPS
// at the lowest resolution, this device gets the poster instead. The slow limit must stay
// clear of the idle frame caps in deviceTier.js, or a capped loop would read as a slow one.
const SLOW_FRAME_SECONDS = 1 / 22
const UNUSABLE_FRAME_SECONDS = 1 / 12
const GOVERNOR_WINDOW_FRAMES = 60

const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('kkt-debug')

/**
 * Asks for frames only when something on screen is changing. Scrolling, music, the hero's
 * idle float or a pointer move wake it. A settled scene, a hidden tab, an inner route and
 * the entry video all stop the GPU completely.
 */
function FrameDriver({ signalRef, isActiveRef, isPlaying, config }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    let frame = 0
    let last = 0
    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      if (document.hidden || !isActiveRef.current) return
      const signal = signalRef.current
      const isChanging = now < signal.dirtyUntil
      const wantsFrames = isChanging || isPlaying || signal.floatActive || signal.introPending || signal.lanternSettling
      if (!wantsFrames) return
      const fps = isChanging || isPlaying ? config.activeFps : config.idleFps
      if (now - last < 1000 / fps - 2) return
      last = now
      invalidate()
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [invalidate, signalRef, isActiveRef, isPlaying, config])

  return null
}

/** Trades resolution for frame rate at runtime, and gives up on devices that cannot cope. */
function PerformanceGovernor({ dprRange, onDegrade }) {
  const setDpr = useThree((state) => state.setDpr)
  const sample = useRef({ frames: 0, total: 0, dpr: Math.min(window.devicePixelRatio || 1, dprRange[1]) })

  useFrame((_, delta) => {
    // A long gap means the loop was paused, not that the frame was slow.
    if (delta > 0.25) return
    const state = sample.current
    state.frames += 1
    state.total += delta
    if (state.frames < GOVERNOR_WINDOW_FRAMES) return

    const average = state.total / state.frames
    state.frames = 0
    state.total = 0
    if (average <= SLOW_FRAME_SECONDS) return

    if (state.dpr > 1) {
      state.dpr = Math.max(1, state.dpr - 0.25)
      setDpr(state.dpr)
    } else if (average > UNUSABLE_FRAME_SECONDS) {
      onDegrade?.()
    }
  })

  return null
}

function ExperienceScene({ rigRef, signalRef, pointerRef, lanternRef, isActiveRef, isPlaying, hasEntered, isHome, config, onFirstFrame, onDegrade, showExtras, activePlaylistId }) {
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1))
  const gl = useThree((state) => state.gl)
  const layoutName = getLayoutName(aspect)
  const layout = LAYOUTS[layoutName]

  useEffect(() => {
    Object.assign(rigRef.current, layout.stages.hero)
    signalRef.current.dirtyUntil = performance.now() + SETTLE_MS
    if (!isHome || !hasEntered) return undefined

    const markDirty = () => {
      signalRef.current.dirtyUntil = performance.now() + SETTLE_MS
    }
    const timeline = createScrollTimeline({ rig: rigRef.current, poses: layout.stages, textFadeShare: layout.textFadeShare, onUpdate: markDirty })
    if (debug) window.__kktDebug = { ...window.__kktDebug, stages: () => timeline.stages, triggers: countScrollTriggers }
    return () => timeline.kill()
  }, [layout, isHome, hasEntered, rigRef, signalRef])

  useEffect(() => {
    if (!debug) return undefined
    window.__kktDebug = { ...window.__kktDebug, rig: rigRef.current, signal: signalRef.current, renderer: () => gl.info, layout: layoutName }
    return undefined
  }, [gl, rigRef, signalRef, layoutName])

  return (
    <>
      <CameraRig rigRef={rigRef} />
      <StudioEnvironment rigRef={rigRef} lanternRef={lanternRef} signalRef={signalRef} />
      <VinylRig
        rigRef={rigRef}
        signalRef={signalRef}
        pointerRef={pointerRef}
        scale={layout.scale}
        isPlaying={isPlaying}
        onFirstFrame={onFirstFrame}
      />
      {config.dustCount > 0 && <DustField rigRef={rigRef} signalRef={signalRef} count={config.dustCount} />}
      {/* Loaded only after the record has drawn, in their own boundaries, so they can never
          hold up the poster takeover. Both start invisible and fade in with the story. */}
      {showExtras && (
        <Suspense fallback={null}>
          <StudioRoom rigRef={rigRef} />
        </Suspense>
      )}
      {showExtras && (
        <Suspense fallback={null}>
          <Cassettes rigRef={rigRef} layout={layout} activePlaylistId={activePlaylistId} />
        </Suspense>
      )}
      <FrameDriver signalRef={signalRef} isActiveRef={isActiveRef} isPlaying={isPlaying} config={config} />
      <PerformanceGovernor dprRange={config.dpr} onDegrade={onDegrade} />
    </>
  )
}

export default function ExperienceCanvas({ tier, isHome, isCovered, isPlaying, hasEntered, activePlaylistId, onReady, onDegrade }) {
  const config = TIER_CONFIG[tier]
  const wrapperRef = useRef(null)
  const rigRef = useRef({ ...LAYOUTS.desktop.stages.hero })
  const pointerRef = useRef({ x: 0, y: 0 })
  const lanternRef = useRef('medium')
  const isActiveRef = useRef(false)
  const signalRef = useRef({
    dirtyUntil: 0,
    intro: 0,
    floatActive: false,
    introPending: true,
    lanternSettling: false,
    freezeIntro: debug === 'freeze'
  })
  const [isReady, setIsReady] = useState(false)

  const isActive = isHome && !isCovered

  useEffect(() => {
    isActiveRef.current = isActive
    if (isActive) signalRef.current.dirtyUntil = performance.now() + SETTLE_MS
  }, [isActive])

  useEffect(() => {
    useGLTF.preload(MODEL_PATH)
  }, [])

  // The room and tapes come after the record, so they never compete with its download.
  useEffect(() => {
    if (!isReady) return
    useGLTF.preload(ROOM_PATH)
    useGLTF.preload(CASSETTES_PATH)
  }, [isReady])

  // Pointer parallax writes to a ref. It only needs frames while the pointer is moving.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined
    const handlePointerMove = (e) => {
      const { innerWidth, innerHeight } = window
      if (!innerWidth || !innerHeight) return
      pointerRef.current.x = (e.clientX / innerWidth) * 2 - 1
      pointerRef.current.y = (e.clientY / innerHeight) * 2 - 1
      signalRef.current.dirtyUntil = performance.now() + SETTLE_MS
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  // Follow the lantern control through the attribute ThekaCounter already sets.
  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      lanternRef.current = root.getAttribute('data-lantern-level') || 'medium'
      signalRef.current.lanternSettling = true
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['data-lantern-level'] })
    return () => observer.disconnect()
  }, [])

  const handleFirstFrame = () => {
    setIsReady(true)
    onReady?.()
  }

  return (
    <div
      ref={wrapperRef}
      className={`experience-canvas ${isReady ? 'is-loaded' : ''} ${isHome ? '' : 'is-parked'}`}
    >
      <Canvas
        frameloop="demand"
        dpr={config.dpr}
        camera={INITIAL_CAMERA}
        gl={{
          antialias: config.antialias,
          alpha: true,
          powerPreference: config.powerPreference,
          preserveDrawingBuffer: false
        }}
      >
        <Suspense fallback={null}>
          <ExperienceScene
            rigRef={rigRef}
            signalRef={signalRef}
            pointerRef={pointerRef}
            lanternRef={lanternRef}
            isActiveRef={isActiveRef}
            isPlaying={isPlaying}
            hasEntered={hasEntered}
            isHome={isHome}
            config={config}
            onFirstFrame={handleFirstFrame}
            onDegrade={onDegrade}
            showExtras={isReady}
            activePlaylistId={activePlaylistId}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
