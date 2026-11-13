import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const VERTEX_SHADER = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vTwinkle;

  void main() {
    vec3 drifted = position;
    drifted.x += sin(uTime * 0.07 + aSeed * 6.28) * 0.35;
    drifted.y += sin(uTime * 0.05 + aSeed * 12.1) * 0.28;
    drifted.z += cos(uTime * 0.06 + aSeed * 9.3) * 0.3;
    vec4 view = modelViewMatrix * vec4(drifted, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = (5.0 + aSeed * 11.0) * uPixelRatio / max(-view.z, 0.5);
    vTwinkle = 0.45 + 0.55 * sin(uTime * 0.4 + aSeed * 40.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  varying float vTwinkle;

  void main() {
    float distanceFromCentre = length(gl_PointCoord - 0.5);
    float softness = smoothstep(0.5, 0.05, distanceFromCentre);
    gl_FragColor = vec4(vec3(1.0, 0.74, 0.46), softness * vTwinkle * uOpacity * 0.5);
  }
`

/** Dust in the lamp light: one draw call, animated entirely on the GPU. */
export function DustField({ rigRef, signalRef, count }) {
  const dpr = useThree((state) => state.viewport.dpr)
  const pointsRef = useRef(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    // A fixed sequence, so the field is the same on every visit.
    const next = (i, salt) => {
      const value = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
      return value - Math.floor(value)
    }
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (next(i, 1) - 0.5) * 9
      positions[i * 3 + 1] = (next(i, 2) - 0.5) * 5.5
      positions[i * 3 + 2] = (next(i, 3) - 0.5) * 6 - 0.5
      seeds[i] = next(i, 4)
    }
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    result.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return result
  }, [count])

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), [])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return
    const { uTime, uOpacity, uPixelRatio } = points.material.uniforms
    uTime.value += Math.min(delta, 0.05)
    uOpacity.value = rigRef.current.dust * rigRef.current.opacity * signalRef.current.intro
    uPixelRatio.value = dpr
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
