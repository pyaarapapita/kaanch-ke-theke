/**
 * Chooses how much 3D a device gets. "static" never downloads Three.js: it keeps the
 * captured hero poster, so reduced-motion, Save-Data and weak devices pay nothing for it.
 */
export const TIER_CONFIG = {
  high: { dpr: [1, 1.75], antialias: true, powerPreference: 'high-performance', dustCount: 320, activeFps: 60, idleFps: 30 },
  mid: { dpr: [1, 1.25], antialias: true, powerPreference: 'default', dustCount: 90, activeFps: 45, idleFps: 30 }
}

export function detectTier() {
  if (typeof window === 'undefined' || !window.WebGL2RenderingContext) return 'static'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'

  const connection = navigator.connection
  const effectiveType = connection?.effectiveType || ''
  if (connection?.saveData || /2g$/.test(effectiveType)) return 'static'

  const memory = navigator.deviceMemory
  const cores = navigator.hardwareConcurrency
  if ((memory && memory <= 2) || (cores && cores <= 2)) return 'static'

  const isTouch = window.matchMedia('(pointer: coarse)').matches
  const isModest = (memory && memory <= 4) || (cores && cores <= 4) || effectiveType === '3g'
  return isTouch || isModest || window.innerWidth <= 900 ? 'mid' : 'high'
}
