import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DRY = new THREE.Color('#C6A56A')
const WET = new THREE.Color('#3A291C')
const scratch = new THREE.Color()

function glow(hot) {
  return {
    emissive: hot ? '#7EC8C3' : '#000000',
    emissiveIntensity: hot ? 0.45 : 0,
  }
}

export function Clickable({ id, onSelect, children }) {
  return (
    <group
      onClick={(event) => {
        event.stopPropagation()
        onSelect(id)
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      {children}
    </group>
  )
}

export function Soil({ moisture, reduced }) {
  const material = useRef(null)

  useFrame((_, delta) => {
    if (!material.current) return
    scratch.copy(DRY).lerp(WET, THREE.MathUtils.clamp(moisture / 100, 0, 1))
    if (reduced) material.current.color.copy(scratch)
    else material.current.color.lerp(scratch, 1 - Math.exp(-delta * 2.4))
  })

  return (
    <mesh position={[0, 0.36, 0]} receiveShadow>
      <cylinderGeometry args={[0.29, 0.29, 0.1, 28]} />
      <meshStandardMaterial ref={material} color="#C6A56A" roughness={0.96} />
    </mesh>
  )
}

export function Tray({ hot }) {
  return (
    <mesh position={[0, 0.02, 0]} receiveShadow>
      <cylinderGeometry args={[0.52, 0.48, 0.045, 28]} />
      <meshStandardMaterial color="#8E948F" roughness={0.48} metalness={0.28} {...glow(hot)} />
    </mesh>
  )
}

export function PotBody({ hot }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.27, 0.4, 28]} />
        <meshStandardMaterial color="#C4623E" roughness={0.82} {...glow(hot)} />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.34, 0.028, 10, 28]} />
        <meshStandardMaterial color="#B55834" roughness={0.74} />
      </mesh>
    </group>
  )
}

export function Sensor({ hot }) {
  return (
    <group position={[0.08, 0.5, 0.22]} rotation={[0.55, 0, -0.25]} scale={1.4}>
      <mesh position={[0, -0.13, 0]} castShadow>
        <boxGeometry args={[0.045, 0.26, 0.012]} />
        <meshStandardMaterial color="#171717" {...glow(hot)} />
      </mesh>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.11, 0.13, 0.022]} />
        <meshStandardMaterial color="#1E6A45" roughness={0.5} {...glow(hot)} />
      </mesh>
    </group>
  )
}

export function Pump({ hot, spinning }) {
  const rollers = useRef(null)

  useFrame((_, delta) => {
    if (rollers.current && spinning) rollers.current.rotation.z -= delta * 5
  })

  return (
    <group>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.4, 0.32, 0.34]} />
        <meshStandardMaterial
          color="#5E6A66"
          roughness={0.42}
          metalness={0.2}
          {...glow(hot)}
        />
      </mesh>
      <group ref={rollers} position={[0, 0.2, 0.18]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.05, 20]} />
          <meshStandardMaterial color="#242826" metalness={0.45} roughness={0.32} />
        </mesh>
        {[0, 1, 2].map((index) => {
          const angle = (index / 3) * Math.PI * 2
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * 0.055, Math.sin(angle) * 0.055, 0.03]}
            >
              <sphereGeometry args={[0.026, 10, 10]} />
              <meshStandardMaterial color="#D5DCD8" metalness={0.55} roughness={0.28} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export function Tank({ hot, reservoirOk, reduced, floatHot }) {
  const water = useRef(null)
  const float = useRef(null)
  const shown = useRef(reservoirOk ? 0.48 : 0.08)

  useFrame((_, delta) => {
    const goal = reservoirOk ? 0.48 : 0.08
    const step = reduced ? 1 : 1 - Math.exp(-delta * 3)
    shown.current += (goal - shown.current) * step
    if (water.current) {
      water.current.scale.y = shown.current / 0.48
      water.current.position.y = shown.current / 2
    }
    if (float.current) {
      float.current.position.y = 0.08 + shown.current * 0.92
      float.current.rotation.z = reservoirOk ? -0.25 : 0.85
    }
  })

  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.38, 0.4, 0.8, 32, 1, true]} />
        <meshStandardMaterial
          color="#E7F6F3"
          transparent
          opacity={0.16}
          roughness={0.05}
          metalness={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          {...glow(hot)}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshStandardMaterial color="#B7CFCB" roughness={0.3} />
      </mesh>
      <mesh ref={water} position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.48, 32]} />
        <meshStandardMaterial color="#6FB8B4" roughness={0.18} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.02, 8, 28]} />
        <meshStandardMaterial color="#D7E7E3" roughness={0.25} metalness={0.12} />
      </mesh>
      <group ref={float} position={[0.16, 0.62, 0]}>
        <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 8]} />
          <meshStandardMaterial color="#C9D2CE" metalness={0.4} roughness={0.3} {...glow(floatHot)} />
        </mesh>
        <mesh position={[0.02, 0, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#F2F7F5" roughness={0.3} {...glow(floatHot)} />
        </mesh>
      </group>
    </group>
  )
}

export function PiBoard({ hot }) {
  return (
    <group position={[0, 0.2, 0]} rotation={[-0.55, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.86, 0.52, 0.028]} />
        <meshStandardMaterial color="#1E6A45" roughness={0.48} {...glow(hot)} />
      </mesh>
      <mesh position={[0.08, -0.02, 0.03]}>
        <boxGeometry args={[0.22, 0.22, 0.03]} />
        <meshStandardMaterial color="#161616" />
      </mesh>
      <mesh position={[0.38, -0.14, 0.04]}>
        <boxGeometry args={[0.08, 0.18, 0.06]} />
        <meshStandardMaterial color="#C5CCCE" metalness={0.65} roughness={0.28} />
      </mesh>
      <mesh position={[-0.32, 0.08, 0.03]}>
        <boxGeometry args={[0.07, 0.38, 0.035]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-0.32, 0.24 - index * 0.048, 0.055]}>
          <boxGeometry args={[0.05, 0.012, 0.018]} />
          <meshStandardMaterial color="#D6C07A" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

export function AdcBoard({ hot }) {
  return (
    <group position={[0, 0.08, 0]} rotation={[-0.65, 0.25, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.44, 0.28, 0.02]} />
        <meshStandardMaterial color="#1E6A45" roughness={0.5} {...glow(hot)} />
      </mesh>
      <mesh position={[0.08, 0, 0.02]}>
        <boxGeometry args={[0.14, 0.1, 0.02]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  )
}

export function Mosfet({ hot }) {
  return (
    <mesh position={[0, 0.025, 0]} castShadow>
      <boxGeometry args={[0.36, 0.04, 0.24]} />
      <meshStandardMaterial color="#244E86" roughness={0.45} {...glow(hot)} />
    </mesh>
  )
}

export function Supply({ hot }) {
  return (
    <mesh position={[0, 0.1, 0]} castShadow>
      <boxGeometry args={[0.48, 0.2, 0.32]} />
      <meshStandardMaterial color="#2C312F" roughness={0.55} {...glow(hot)} />
    </mesh>
  )
}

export function Cup({ progress }) {
  const water = useRef(null)

  useFrame(() => {
    if (!water.current) return
    const height = 0.03 + progress.current * 0.2
    water.current.scale.y = height / 0.2
    water.current.position.y = 0.02 + height / 2
  })

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.16, 0.13, 0.32, 24, 1, true]} />
        <meshStandardMaterial
          color="#E7F4F2"
          transparent
          opacity={0.38}
          roughness={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={water} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.12, 0.11, 0.2, 24]} />
        <meshStandardMaterial color="#7EC8C3" transparent opacity={0.85} roughness={0.2} />
      </mesh>
    </group>
  )
}

export function Hose({ points, visible, active }) {
  const material = useRef(null)
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  )

  useFrame((state) => {
    if (!material.current) return
    material.current.emissiveIntensity = active
      ? 0.35 + Math.sin(state.clock.elapsedTime * 9) * 0.2
      : 0
  })

  return (
    <mesh visible={visible}>
      <tubeGeometry args={[curve, 64, 0.028, 8, false]} />
      <meshStandardMaterial
        ref={material}
        color="#F4EBDD"
        emissive="#7EC8C3"
        emissiveIntensity={0}
        roughness={0.35}
        transparent
        opacity={0.78}
        depthWrite={false}
      />
    </mesh>
  )
}

export function Wire({ points, color, hot }) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  )

  return (
    <mesh>
      <tubeGeometry args={[curve, 28, 0.01, 6, false]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hot ? 0.35 : 0}
        transparent
        opacity={hot ? 1 : 0.28}
      />
    </mesh>
  )
}

export function Droplets({ points, active, reduced }) {
  const count = 8
  const mesh = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  )

  useLayoutEffect(() => {
    if (!mesh.current) return
    for (let index = 0; index < count; index += 1) {
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [count, dummy])

  useFrame((state) => {
    if (!mesh.current) return
    const time = state.clock.elapsedTime
    for (let index = 0; index < count; index += 1) {
      const along = (time * 0.28 + index / count) % 1
      const point = curve.getPoint(along)
      dummy.position.copy(point)
      const show = active && !reduced && along > 0.05 && along < 0.96
      dummy.scale.setScalar(show ? 1 : 0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <sphereGeometry args={[0.048, 12, 12]} />
      <meshStandardMaterial color="#F3FFFC" emissive="#7EC8C3" emissiveIntensity={0.55} roughness={0.15} />
    </instancedMesh>
  )
}
