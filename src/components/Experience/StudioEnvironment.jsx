import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const LANTERN_LEVELS = { dim: 0.55, medium: 1, bright: 1.7 }
const LANTERN_BASE_INTENSITY = 2.6
const KEY_BASE_INTENSITY = 3.6
const RIM_BASE_INTENSITY = 1.2
const HALO_MAX_OPACITY = 0.2

/**
 * A tiny procedural reflection probe: a dark room with one warm lamp. It gives the vinyl a
 * soft sheen at the angles where direct lights alone leave it black, with no extra asset.
 */
function createReflectionProbe(renderer) {
  const room = new THREE.Scene()
  room.background = new THREE.Color('#050403')
  const lamp = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.1, 1.5), side: THREE.DoubleSide })
  )
  lamp.position.set(1.5, 3.2, 1.5)
  lamp.lookAt(0, 0, 0)
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.26, 0.11), side: THREE.DoubleSide })
  )
  fill.position.set(-3, 0.5, 2)
  fill.lookAt(0, 0, 0)
  room.add(lamp, fill)

  const generator = new THREE.PMREMGenerator(renderer)
  const target = generator.fromScene(room, 0.06)
  generator.dispose()
  lamp.geometry.dispose()
  lamp.material.dispose()
  fill.geometry.dispose()
  fill.material.dispose()
  return target
}

function createHaloTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 176, 96, 1)')
  gradient.addColorStop(0.45, 'rgba(184, 110, 52, 0.32)')
  gradient.addColorStop(1, 'rgba(184, 110, 52, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * The existing studio lighting from the hero, driven by the rig and by the lantern on the
 * page through the data-lantern-level attribute. No new models or rooms: that is P2.
 */
export function StudioEnvironment({ rigRef, lanternRef, signalRef }) {
  const getStore = useThree((state) => state.get)
  const keyRef = useRef(null)
  const rimRef = useRef(null)
  const lanternLightRef = useRef(null)
  const haloRef = useRef(null)
  const haloTexture = useMemo(() => createHaloTexture(), [])

  useEffect(() => {
    const { gl, scene } = getStore()
    const probe = createReflectionProbe(gl)
    scene.environment = probe.texture
    scene.environmentIntensity = 0.42
    return () => {
      scene.environment = null
      probe.dispose()
    }
  }, [getStore])

  useEffect(() => () => haloTexture.dispose(), [haloTexture])

  useFrame((_, delta) => {
    const rig = rigRef.current
    if (keyRef.current) keyRef.current.intensity = KEY_BASE_INTENSITY * rig.key
    if (rimRef.current) rimRef.current.intensity = RIM_BASE_INTENSITY * rig.rim

    const lantern = lanternLightRef.current
    if (lantern) {
      const target = LANTERN_BASE_INTENSITY * (LANTERN_LEVELS[lanternRef.current] ?? 1)
      lantern.intensity = THREE.MathUtils.damp(lantern.intensity, target, 3, delta)
      signalRef.current.lanternSettling = Math.abs(lantern.intensity - target) > 0.01
    }

    const halo = haloRef.current
    if (halo) {
      halo.position.set(rig.dx - 0.15, rig.dy + 0.1, rig.dz - 1.6)
      halo.material.opacity = rig.halo * HALO_MAX_OPACITY * rig.opacity
      halo.visible = rig.halo > 0.01
    }
  })

  return (
    <>
      {/* Studio Lighting Rig replicating Blender Cycles setup */}
      <ambientLight color="#0e0d11" intensity={1.2} />
      {/* Warm Amber Rim Key (grazes concentric sound grooves from upper-right) */}
      <directionalLight ref={keyRef} position={[3.8, 2.8, 3.4]} color="#ffa64d" intensity={KEY_BASE_INTENSITY} />
      {/* Nostalgic Lantern Glow, following the lantern control on the page */}
      <pointLight ref={lanternLightRef} position={[-3.2, -1.8, 2.2]} color="#ff8c33" intensity={LANTERN_BASE_INTENSITY} distance={9} decay={2} />
      {/* Vintage Gold Label Overhead Softbox */}
      <directionalLight position={[0.8, 4.0, 2.8]} color="#fff1dc" intensity={2.2} />
      {/* Cool Slate Silhouette Rim */}
      <directionalLight ref={rimRef} position={[-2.2, 2.5, -3.0]} color="#8aaee6" intensity={RIM_BASE_INTENSITY} />

      <sprite ref={haloRef} scale={[9, 9, 1]} visible={false}>
        <spriteMaterial map={haloTexture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  )
}
