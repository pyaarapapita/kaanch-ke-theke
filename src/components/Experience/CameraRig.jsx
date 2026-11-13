import { useFrame } from '@react-three/fiber'

/** Moves the camera from the rig. Nothing here touches React state. */
export function CameraRig({ rigRef }) {
  useFrame(({ camera }) => {
    const rig = rigRef.current
    camera.position.set(rig.cx, rig.cy, rig.cz)
    camera.lookAt(rig.tx, rig.ty, rig.tz)
  })

  return null
}
