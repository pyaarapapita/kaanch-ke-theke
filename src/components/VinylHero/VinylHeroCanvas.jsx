import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { VinylScene } from './VinylScene'
import './VinylHero.css'

const MODEL_PATH = '/models/vinyl-record-opt.glb'

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger)

// Safe WebGL capability detection
function checkWebGLSupport() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!(window.WebGLRenderingContext && gl)
  } catch {
    return false
  }
}

export function VinylHeroCanvas({
  hasEntered,
  isVideoTransitioning,
  isPlaying = false,
  handleStartEntryTransition
}) {
  const containerRef = useRef(null)
  const textPanelRef = useRef(null)
  const [isCanvasLoaded, setIsCanvasLoaded] = useState(false)
  const [webGLSupported] = useState(() => checkWebGLSupport())
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // Mutable refs for continuous scroll and parallax updates (0 React re-renders during interactions)
  const scrollProgressRef = useRef(0)
  const pointerPosRef = useRef({ x: 0, y: 0 })

  // Conditional asset preloading only when hardware supports WebGL and motion is enabled
  useEffect(() => {
    if (webGLSupported && !isReducedMotion) {
      useGLTF.preload(MODEL_PATH)
    }
  }, [webGLSupported, isReducedMotion])

  // Listen for prefers-reduced-motion system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e) => setIsReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Mouse/Pointer parallax tracking directly to ref (no React reconciliation)
  const handlePointerMove = useCallback((e) => {
    if (isReducedMotion) return
    const { innerWidth, innerHeight } = window
    if (!innerWidth || !innerHeight) return
    pointerPosRef.current.x = (e.clientX / innerWidth) * 2 - 1
    pointerPosRef.current.y = (e.clientY / innerHeight) * 2 - 1
  }, [isReducedMotion])

  // GSAP ScrollTrigger Choreography (updates mutable ref without re-triggering React renders)
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress
        }
      })

      // Coordinate HTML typography reveal and clean recession with scroll
      if (textPanelRef.current && !isReducedMotion) {
        gsap.to(textPanelRef.current, {
          y: -50,
          opacity: 0,
          scale: 0.96,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '68% top',
            scrub: true
          }
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [isReducedMotion])

  return (
    <section
      ref={containerRef}
      className={`hero vinyl-hero-container ${hasEntered ? 'is-entered' : ''}`}
      onPointerMove={handlePointerMove}
      aria-label="काँच के ठेके 3D विनाइल अनुभव"
    >
      {/* 3D WebGL Canvas Layer */}
      {webGLSupported ? (
        <div className={`vinyl-canvas-wrapper ${isCanvasLoaded ? 'is-loaded' : ''}`}>
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 1.8, 4.4], fov: 42 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: false
            }}
            onCreated={() => setIsCanvasLoaded(true)}
          >
            <Suspense fallback={null}>
              <VinylScene
                scrollProgressRef={scrollProgressRef}
                isPlaying={isPlaying}
                isReducedMotion={isReducedMotion}
                pointerPosRef={pointerPosRef}
              />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        /* Static High-Resolution Fallback when WebGL is unavailable */
        <div
          className="vinyl-static-fallback"
          style={{ backgroundImage: "url('/backgrounds/theka-bg.webp')" }}
          role="img"
          aria-label="काँच के ठेके विनाइल रिकॉर्ड"
        />
      )}

      {/* Atmospheric Ambient Lighting Vignette */}
      <div className="vinyl-vignette-overlay" aria-hidden="true" />

      {/* Foreground Content: Accessible Semantic HTML & Controls */}
      <div className="vinyl-hero-content">
        <div ref={textPanelRef} className={`hero-content vinyl-hero-text-panel ${hasEntered ? 'receded' : ''}`}>
          <div className="title-wrapper">
            <motion.h1
              className="main-title"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              काँच के ठेके
            </motion.h1>
            <motion.p
              className="subtitle-english"
              initial={false}
              animate={{ opacity: 0.95 }}
              transition={{ duration: 0.6 }}
            >
              KAANCH KE THEKE — Retro Bollywood Music &amp; Nostalgic Melodies
            </motion.p>
          </div>

          <motion.p
            className="tagline"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
                  initial={false}
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
      </div>
    </section>
  )
}
