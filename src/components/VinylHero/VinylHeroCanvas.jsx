import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { VinylScene } from './VinylScene'

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * The lazy WebGL layer of the hero. The section, poster and text live in VinylHero,
 * so nothing visible depends on this chunk having loaded.
 */
export function VinylHeroCanvas({
  containerRef,
  textPanelRef,
  pointerPosRef,
  hasEntered,
  isPlaying = false,
  onReady
}) {
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const scrollProgressRef = useRef(0)

  // Listen for prefers-reduced-motion system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e) => setIsReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // GSAP ScrollTrigger Choreography (updates mutable ref without re-triggering React renders)
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
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
  }, [containerRef, textPanelRef, isReducedMotion])

  // Entry unlocks the page height, and fonts can change layout: recalculate both.
  useEffect(() => {
    let isCurrent = true
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    document.fonts?.ready.then(() => {
      if (isCurrent) ScrollTrigger.refresh()
    })
    return () => {
      isCurrent = false
      cancelAnimationFrame(frame)
    }
  }, [hasEntered])

  const handleFirstFrame = useCallback(() => {
    setIsSceneReady(true)
    onReady?.()
  }, [onReady])

  return (
    <div className={`vinyl-canvas-wrapper ${isSceneReady ? 'is-loaded' : ''}`}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.8, 4.4], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false
        }}
      >
        <Suspense fallback={null}>
          <VinylScene
            scrollProgressRef={scrollProgressRef}
            isPlaying={isPlaying}
            isReducedMotion={isReducedMotion}
            pointerPosRef={pointerPosRef}
            onFirstFrame={handleFirstFrame}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
