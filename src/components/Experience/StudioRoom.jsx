import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export const ROOM_PATH = '/models/studio-room.glb'

/**
 * The back room behind the counter: plank wall, shelves of bottles, the counter, a hanging
 * bulb and a lantern. Its light is baked into one texture in Blender, so it is drawn with an
 * unlit material: one draw call, no lights, no shadows at runtime.
 */
export function StudioRoom({ rigRef }) {
  const { scene } = useGLTF(ROOM_PATH)
  const groupRef = useRef(null)
  const materialRef = useRef(null)

  // Swap the exported material for an unlit one showing the bake exactly as authored.
  const { room, material } = useMemo(() => {
    const copy = scene.clone(true)
    let map = null
    copy.traverse((child) => {
      if (child.isMesh && child.material?.map) map = child.material.map
    })
    const unlit = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
    copy.traverse((child) => {
      if (child.isMesh) {
        child.material = unlit
        child.renderOrder = -1
      }
    })
    return { room: copy, material: unlit }
  }, [scene])

  useEffect(() => {
    materialRef.current = material
    return () => material.dispose()
  }, [material])

  useFrame(() => {
    // The room shares the record's dim; the tapes are the only thing left at full strength.
    const amount = rigRef.current.room * rigRef.current.opacity
    if (materialRef.current) materialRef.current.opacity = amount
    if (groupRef.current) groupRef.current.visible = amount > 0.005
  })

  return <primitive ref={groupRef} object={room} visible={false} />
}
