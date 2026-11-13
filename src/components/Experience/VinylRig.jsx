import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export const MODEL_PATH = '/models/vinyl-record-web.glb'

// About 33⅓ RPM. Only while music plays.
const PLAYBACK_RAD_PER_SECOND = 3.49
const IDLE_SPIN_RAD_PER_SECOND = 0.05
// useFrame runs before each render, so the third call means two frames have been drawn.
const FRAMES_BEFORE_READY = 2
// Parallax and float wait until the poster, which has neither, has finished fading out.
const INTRO_DELAY_SECONDS = 0.9

export function VinylRig({ rigRef, signalRef, pointerRef, scale, isPlaying, onFirstFrame }) {
  const { nodes, materials } = useGLTF(MODEL_PATH)
  const rootRef = useRef(null)
  const spinRef = useRef(null)
  const bodyRef = useRef(null)
  const labelRef = useRef(null)
  const motion = useRef({ frames: -1, sinceReady: 0, intro: 0, time: 0, playback: 0, idle: 0 })

  // The scene dim is applied to the record itself, not the whole canvas, so the tapes in the
  // gutters can stay fully visible while the record recedes behind reading sections.
  // The exported materials have white base colours (the textures carry the colour), so
  // scaling the colour darkens the record without changing its look at full strength.
  useEffect(() => {
    for (const mesh of [bodyRef.current, labelRef.current]) {
      if (mesh) mesh.material.transparent = true
    }
  }, [])

  useFrame((_, rawDelta) => {
    // After a pause the delta spans the whole gap. Clamp it so nothing jumps on resume.
    const delta = Math.min(rawDelta, 0.05)
    const root = rootRef.current
    const spin = spinRef.current
    if (!root || !spin) return

    const rig = rigRef.current
    const state = motion.current
    const signal = signalRef.current
    state.frames += 1

    if (state.frames >= FRAMES_BEFORE_READY && !signal.freezeIntro) {
      state.sinceReady += delta
      if (state.sinceReady > INTRO_DELAY_SECONDS) {
        state.intro = THREE.MathUtils.damp(state.intro, 1, 1.6, delta)
      }
    }

    const floatAmount = state.intro * rig.float
    if (floatAmount > 0.001) {
      state.time += delta
      state.idle += delta * IDLE_SPIN_RAD_PER_SECOND * floatAmount
    }
    if (isPlaying) state.playback += delta * PLAYBACK_RAD_PER_SECOND

    const pointer = pointerRef.current
    const parallax = 0.08 * state.intro * rig.parallax
    const offsetX = pointer.x * parallax
    const offsetY = pointer.y * parallax
    const driftY = Math.sin(state.time * 0.55) * 0.028 * floatAmount
    const driftTilt = Math.sin(state.time * 0.37) * 0.009 * floatAmount

    root.position.set(rig.dx + offsetX, rig.dy - offsetY + driftY, rig.dz)
    root.rotation.x = rig.rx - offsetY * 0.18 + driftTilt
    root.rotation.z = rig.rz + offsetX * 0.18
    spin.rotation.y = rig.spin + state.playback + state.idle
    // Recede by darkening while the record is solid, and only fade out at the low end. A
    // half-transparent record over the lit shelves reads as glass, not vinyl.
    const darken = Math.min(1, rig.opacity / 0.55)
    const alpha = Math.min(1, rig.opacity / 0.3)
    for (const mesh of [bodyRef.current, labelRef.current]) {
      if (!mesh) continue
      mesh.material.color.setScalar(darken)
      mesh.material.envMapIntensity = darken
      mesh.material.opacity = alpha
    }

    signal.intro = state.intro
    signal.floatActive = floatAmount > 0.01
    signal.introPending = state.frames <= FRAMES_BEFORE_READY || (!signal.freezeIntro && state.intro < 0.98)
    if (state.frames === FRAMES_BEFORE_READY) onFirstFrame?.()
  })

  return (
    <group ref={rootRef} scale={scale}>
      <group ref={spinRef}>
        {nodes.Vinyl_Body && (
          <mesh ref={bodyRef} geometry={nodes.Vinyl_Body.geometry} material={materials.M_Vinyl} />
        )}
        {nodes.Vinyl_Label && (
          <mesh ref={labelRef} geometry={nodes.Vinyl_Label.geometry} material={materials.M_Vintage_Gold_Label} />
        )}
      </group>
    </group>
  )
}
