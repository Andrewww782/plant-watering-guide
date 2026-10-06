import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function Leaf({ position, rotation, scale, color }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <sphereGeometry args={[0.12, 12, 10]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  )
}

function Basil() {
  const leaves = [
    [0.16, 0.22, 0, 0.4, '#2C7A3C'],
    [-0.15, 0.28, 0.04, -0.5, '#348A46'],
    [0.14, 0.4, -0.04, 0.7, '#266E36'],
    [-0.12, 0.48, 0.06, -0.3, '#3C9450'],
    [0.05, 0.58, 0.02, 0.2, '#2F7D40'],
  ]
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.022, 0.58, 8]} />
        <meshStandardMaterial color="#5C4632" roughness={0.8} />
      </mesh>
      {leaves.map(([x, y, z, yaw, color], index) => (
        <Leaf
          key={index}
          position={[x, y, z]}
          rotation={[0.3, yaw, x > 0 ? -0.5 : 0.5]}
          scale={[1.15, 0.28, 0.62]}
          color={color}
        />
      ))}
    </group>
  )
}

function Pothos() {
  const leaves = [
    [0.1, 0.2, 0.02, 0.3, '#1F6B3A'],
    [-0.1, 0.18, 0.03, -0.4, '#D5D78A'],
    [0.04, 0.34, -0.02, 0.15, '#186033'],
    [-0.03, 0.1, 0.08, 0.7, '#2E7A44'],
  ]
  return (
    <group>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.028, 0.32, 8]} />
        <meshStandardMaterial color="#4E6840" roughness={0.75} />
      </mesh>
      {leaves.map(([x, y, z, tilt, color], index) => (
        <Leaf
          key={index}
          position={[x, y, z]}
          rotation={[0.35, tilt, x >= 0 ? -0.45 : 0.45]}
          scale={[1.05, 0.42, 0.78]}
          color={color}
        />
      ))}
    </group>
  )
}

function Fern() {
  const fronds = Array.from({ length: 11 }, (_, index) => {
    const angle = (index / 11) * Math.PI * 2
    return angle
  })
  return (
    <group>
      {fronds.map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <mesh
            position={[0.14, 0.14, 0]}
            rotation={[0, 0, -0.85]}
            scale={[1.8, 0.32, 0.48]}
            castShadow
          >
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshStandardMaterial color="#3E8A4C" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Succulent() {
  const ring = Array.from({ length: 8 }, (_, index) => (index / 8) * Math.PI * 2)
  return (
    <group>
      {ring.map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <mesh
            position={[0.12, 0.06, 0]}
            rotation={[0, 0, -1.05]}
            scale={[1.7, 0.45, 0.7]}
            castShadow
          >
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#8EAEA0" roughness={0.42} />
          </mesh>
        </group>
      ))}
      {ring.slice(0, 5).map((angle) => (
        <group key={`in-${angle}`} rotation={[0, angle + 0.3, 0]}>
          <mesh
            position={[0.06, 0.1, 0]}
            rotation={[0, 0, -0.45]}
            scale={[1.2, 0.55, 0.62]}
            castShadow
          >
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshStandardMaterial color="#A9C4B6" roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const KINDS = {
  basil: Basil,
  pothos: Pothos,
  fern: Fern,
  succulent: Succulent,
}

export function Plant({ kind, reduced }) {
  const ref = useRef(null)
  const Spec = KINDS[kind] ?? Pothos

  useFrame((state) => {
    if (!ref.current || reduced) {
      if (ref.current) ref.current.rotation.z = 0
      return
    }
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7) * 0.025
  })

  return (
    <group ref={ref} position={[0, 0.42, 0]}>
      <Spec />
    </group>
  )
}
