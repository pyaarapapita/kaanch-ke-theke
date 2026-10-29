import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/vinyl-record-opt.glb'

export function VinylScene({
  scrollProgressRef,
  isPlaying = false,
  isReducedMotion = false,
  pointerPosRef
}) {
  const { nodes, materials } = useGLTF(MODEL_PATH)
  const rootRef = useRef(null)
  const spinGroupRef = useRef(null)
  const { viewport } = useThree()

  // Responsive scale and placement tailored across screen sizes
  const { responsiveScale, isPortrait, isSmallMobile } = useMemo(() => {
    const width = viewport.width
    const smallMobile = width < 2.0
    const portrait = width < 3.8
    let scale = 1.05
    if (smallMobile) scale = 0.60
    else if (portrait) scale = 0.72
    return { responsiveScale: scale, isPortrait: portrait, isSmallMobile: smallMobile }
  }, [viewport.width])

  // Continuous playback rotation accumulator
  const playbackAngleRef = useRef(0)

  useFrame((state, delta) => {
    if (!rootRef.current) return

    // 1. Playback continuous spin (~33⅓ RPM = 3.49 rad/s) only when music is active and motion allowed
    if (isPlaying && !isReducedMotion) {
      playbackAngleRef.current += delta * 3.49
    }

    // 2. Read scroll progress from mutable ref (ZERO React re-renders)
    const rawProgress = scrollProgressRef?.current ?? 0
    const p = THREE.MathUtils.clamp(rawProgress, 0, 1)

    // 3. Responsive spatial composition
    // Portrait (Mobile & Tablet): placed centered in upper half, leaving ample room for Hindi typography below
    // Desktop & Laptop: positioned on the right half with breathing space
    let targetX = 1.48 + p * 0.25
    let targetY = 0.15 - p * 0.35
    let targetZ = -0.2 + p * 0.28

    if (isPortrait) {
      targetX = 0
      targetY = (isSmallMobile ? 0.62 : 0.68) - p * 0.26
      targetZ = -0.32 + p * 0.35
    }

    // Restrained, cinematic tilt angles (Y axis is spin, X is face tilt, Z is banking)
    const targetRotX = isReducedMotion ? 0.45 : (isPortrait ? 0.40 + p * 0.16 : 0.52 + p * 0.16)
    const scrollSpin = isReducedMotion ? 0 : p * Math.PI * 3.5
    const targetRotY = scrollSpin + playbackAngleRef.current
    const targetRotZ = isReducedMotion ? -0.10 : (isPortrait ? -0.08 + p * 0.06 : -0.16 + p * 0.10)

    // 4. Pointer parallax (subtle interactive float, disabled on mobile/reduced motion)
    const ptr = pointerPosRef?.current || { x: 0, y: 0 }
    const parallaxX = (isReducedMotion || isPortrait) ? 0 : ptr.x * 0.08
    const parallaxY = (isReducedMotion || isPortrait) ? 0 : ptr.y * 0.08

    // Smooth physics-based damping without garbage allocations
    rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, targetX + parallaxX, 6, delta)
    rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, targetY - parallaxY, 6, delta)
    rootRef.current.position.z = THREE.MathUtils.damp(rootRef.current.position.z, targetZ, 6, delta)

    rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, targetRotX - parallaxY * 0.18, 6, delta)
    rootRef.current.rotation.z = THREE.MathUtils.damp(rootRef.current.rotation.z, targetRotZ + parallaxX * 0.18, 6, delta)

    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.y = THREE.MathUtils.damp(spinGroupRef.current.rotation.y, targetRotY, 8, delta)
    }
  })

  return (
    <>
      {/* Studio Lighting Rig replicating Blender Cycles setup */}
      {/* 1. Ambient Charcoal Fill */}
      <ambientLight color="#0e0d11" intensity={1.2} />

      {/* 2. Warm Amber Rim Key (grazes concentric sound grooves from upper-right) */}
      <directionalLight
        position={[3.8, 2.8, 3.4]}
        color="#ffa64d"
        intensity={3.6}
      />

      {/* 3. Kaanch Ke Theke Nostalgic Lantern Glow (warm amber point fill from lower-left) */}
      <pointLight
        position={[-3.2, -1.8, 2.2]}
        color="#ff8c33"
        intensity={2.6}
        distance={9}
        decay={2}
      />

      {/* 4. Vintage Gold Label Overhead Softbox (brings out brushed gold lathe sheen) */}
      <directionalLight
        position={[0.8, 4.0, 2.8]}
        color="#fff1dc"
        intensity={2.2}
      />

      {/* 5. Cool Slate Silhouette Rim (soft edge separation on the dark back rim) */}
      <directionalLight
        position={[-2.2, 2.5, -3.0]}
        color="#8aaee6"
        intensity={1.2}
      />

      {/* 3D Vinyl Model Hierarchy: Direct reuse of cached GLB materials without clone allocation */}
      <group ref={rootRef} scale={responsiveScale}>
        <group ref={spinGroupRef}>
          {nodes.Vinyl_Body && (
            <mesh
              geometry={nodes.Vinyl_Body.geometry}
              material={materials.M_Vinyl}
              castShadow
              receiveShadow
            />
          )}
          {nodes.Vinyl_Label && (
            <mesh
              geometry={nodes.Vinyl_Label.geometry}
              material={materials.M_Vintage_Gold_Label}
              castShadow
              receiveShadow
            />
          )}
        </group>
      </group>
    </>
  )
}
