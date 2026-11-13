import { lazy, memo, Suspense, useCallback, useEffect, useState } from 'react'
import { VinylHeroErrorBoundary } from '../VinylHero/VinylHeroErrorBoundary'
import { detectTier } from './deviceTier'
import './Experience.css'

// The only way into Three.js and GSAP. Inner pages and static devices never load this chunk.
const ExperienceCanvas = lazy(() => import('./ExperienceCanvas'))

/**
 * The persistent 3D layer. It is fixed behind all page content and ignores pointer events.
 * Once loaded it stays mounted across routes, parked and not drawing on inner pages, so the
 * site only ever creates one WebGL context.
 */
export const ExperienceLayer = memo(function ExperienceLayer({
  isHome,
  isCovered,
  isPlaying,
  hasEntered,
  activePlaylistId,
  onReady,
  onLost
}) {
  const [tier, setTier] = useState(detectTier)
  const [hasVisitedHome, setHasVisitedHome] = useState(isHome)
  const [canStart, setCanStart] = useState(false)

  if (isHome && !hasVisitedHome) setHasVisitedHome(true)

  // Start after the page has painted: the poster already looks right until then.
  useEffect(() => {
    if (!hasVisitedHome || tier === 'static') return undefined
    const start = () => setCanStart(true)
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(start, { timeout: 1200 })
      return () => window.cancelIdleCallback?.(id)
    }
    const timer = setTimeout(start, 300)
    return () => clearTimeout(timer)
  }, [hasVisitedHome, tier])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => {
      setTier(detectTier())
      if (motion.matches) onLost?.()
    }
    motion.addEventListener('change', handleChange)
    return () => motion.removeEventListener('change', handleChange)
  }, [onLost])

  useEffect(() => {
    document.documentElement.setAttribute('data-kkt-tier', tier)
  }, [tier])

  const handleDegrade = useCallback(() => {
    console.warn('[Experience] Frame rate too low for WebGL, falling back to the poster')
    setTier('static')
    onLost?.()
  }, [onLost])

  if (tier === 'static' || !canStart) return null

  return (
    <div className="experience-layer" aria-hidden="true">
      <VinylHeroErrorBoundary fallback={null} onError={onLost}>
        <Suspense fallback={null}>
          <ExperienceCanvas
            tier={tier}
            isHome={isHome}
            isCovered={isCovered}
            isPlaying={isPlaying}
            hasEntered={hasEntered}
            activePlaylistId={activePlaylistId}
            onReady={onReady}
            onDegrade={handleDegrade}
          />
        </Suspense>
      </VinylHeroErrorBoundary>
    </div>
  )
})
