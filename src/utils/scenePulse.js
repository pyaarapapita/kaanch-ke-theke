export const SCENE_PULSE_EVENT = 'kkt:pulse'

/**
 * Tells the 3D layer that something on the page just happened: a tape was rewound, a mood
 * was picked. The record answers with a short spin and a flare of the lamp behind it.
 * Pages without the 3D layer simply have no listener.
 */
export function pulseScene(strength = 1) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SCENE_PULSE_EVENT, { detail: strength }))
}
