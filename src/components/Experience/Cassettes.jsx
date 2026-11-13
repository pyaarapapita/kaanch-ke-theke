import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { TAPE_PLAYLISTS } from './sceneConfig'

export const CASSETTES_PATH = '/models/cassettes.glb'

const HALF_PI = Math.PI / 2
const smooth = (t) => t * t * (3 - 2 * t)
// Enough self-light that the handwritten labels stay readable while the scene is dimmed.
const LABEL_GLOW = 0.32

const scratch = {
  point: new THREE.Vector3(),
  euler: new THREE.Euler(),
  local: new THREE.Quaternion()
}

/**
 * Five mix-tapes, one per playlist mood. They float in the page gutters through the middle
 * of the story, then gather into a stack beside the playlists. The tape for the playlist
 * that is playing slides out of the stack.
 *
 * Positions are given in screen space (fractions of the view, plus a depth), so the tapes
 * stay in the gutters for every camera move and every viewport. Content never sits on them.
 * In the model the label faces +Y; facing the camera means turning it towards the viewer.
 */
export function Cassettes({ rigRef, layout, activePlaylistId }) {
  const { scene } = useGLTF(CASSETTES_PATH)
  const tapeRefs = useRef([])
  const materialRef = useRef(null)
  const motion = useRef({ time: 0, slide: TAPE_PLAYLISTS.map(() => 0) })

  const { tapes, material } = useMemo(() => {
    const found = []
    scene.traverse((child) => {
      if (child.isMesh && /^Cassette_/.test(child.name)) found.push(child)
    })
    found.sort((a, b) => a.name.localeCompare(b.name))
    const shared = found[0]?.material.clone() ?? null
    if (shared) {
      shared.transparent = true
      shared.opacity = 0
      shared.emissive = new THREE.Color(1, 1, 1)
      shared.emissiveMap = shared.map
      shared.emissiveIntensity = LABEL_GLOW
    }
    const meshes = found.map((mesh) => {
      const copy = new THREE.Mesh(mesh.geometry, shared)
      copy.name = mesh.name
      return copy
    })
    return { tapes: meshes, material: shared }
  }, [scene])

  useEffect(() => {
    materialRef.current = material
    return () => material?.dispose()
  }, [material])

  const activeIndex = TAPE_PLAYLISTS.indexOf(activePlaylistId)

  useFrame(({ camera, size }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const rig = rigRef.current
    const state = motion.current
    const amount = rig.tapes
    if (materialRef.current) materialRef.current.opacity = amount
    if (amount <= 0.005) {
      tapeRefs.current.forEach((tape) => { if (tape) tape.visible = false })
      return
    }
    state.time += delta

    const stack = smooth(Math.min(Math.max(rig.stack, 0), 1))
    const { loose, pile, scale } = layout.tapes
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const aspect = size.width / Math.max(size.height, 1)

    tapeRefs.current.forEach((tape, i) => {
      if (!tape) return
      tape.visible = true
      const [fx, fy, fDepth, tilt, yaw, roll] = loose[i]
      const bob = Math.sin(state.time * 0.6 + i * 1.7) * 0.03 * (1 - stack)
      const sway = Math.sin(state.time * 0.4 + i) * 0.14 * (1 - stack)

      const target = i === activeIndex ? 1 : 0
      state.slide[i] = THREE.MathUtils.damp(state.slide[i], target, 4, delta)

      // Screen position: loose spot, or a place in the stack. The stack piles upwards on
      // screen, and the playing tape slides out towards the page.
      const sx = THREE.MathUtils.lerp(fx, pile.x + Math.sin(i * 2.3) * 0.006 + state.slide[i] * pile.slide, stack)
      const sy = THREE.MathUtils.lerp(fy + bob, pile.y + i * pile.step, stack)
      const depth = THREE.MathUtils.lerp(fDepth, pile.depth, stack)

      scratch.point.set(sx * tanHalf * aspect * depth, sy * tanHalf * depth, -depth)
      tape.position.copy(scratch.point.applyMatrix4(camera.matrixWorld))

      // Face the camera when loose; lie back like a stack seen from just above when piled.
      scratch.euler.set(
        THREE.MathUtils.lerp(HALF_PI + tilt, HALF_PI - pile.lean, stack),
        THREE.MathUtils.lerp(yaw + sway, pile.yaw + Math.sin(i * 1.9) * 0.06, stack),
        THREE.MathUtils.lerp(roll, 0, stack)
      )
      scratch.local.setFromEuler(scratch.euler)
      tape.quaternion.copy(camera.quaternion).multiply(scratch.local)
      tape.scale.setScalar(scale)
    })
  })

  return (
    <group>
      {tapes.map((tape, i) => (
        <primitive key={tape.name} object={tape} ref={(node) => { tapeRefs.current[i] = node }} visible={false} />
      ))}
    </group>
  )
}
