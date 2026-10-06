import { useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { DOSE_MS } from '../logic'
import { useGuide } from '../guide'
import { HOSE_A, HOSE_B, LAYOUT, WIRES } from './layout'
import { Plant } from './plants'
import {
  AdcBoard,
  Clickable,
  Cup,
  Droplets,
  Hose,
  Mosfet,
  PiBoard,
  PotBody,
  Pump,
  Sensor,
  Soil,
  Supply,
  Tank,
  Tray,
  Wire,
} from './hardware'

const TARGET = new THREE.Vector3(0.45, 0.08, 0.02)
const VIEW_OFFSET = new THREE.Vector3(1.05, 0.78, 1.85).normalize()

function showFor(chapter, step) {
  if (chapter !== 'build') {
    return {
      tank: true,
      pumpA: true,
      pumpB: true,
      potA: true,
      potB: true,
      plantA: true,
      plantB: true,
      hoseA: true,
      hoseB: true,
      trayA: true,
      trayB: true,
      sensorA: true,
      sensorB: true,
      pi: true,
      adc: true,
      mosfet: true,
      supply: true,
      float: true,
      cup: false,
      wires: true,
    }
  }

  return {
    tank: step >= 2,
    pumpA: step >= 2,
    pumpB: step >= 5,
    potA: step !== 2,
    potB: step >= 5,
    plantA: step >= 3,
    plantB: step >= 5,
    hoseA: step >= 2,
    hoseB: step >= 5,
    trayA: step >= 4,
    trayB: step >= 5,
    sensorA: step !== 2,
    sensorB: step >= 5,
    pi: true,
    adc: true,
    mosfet: step >= 2,
    supply: step >= 2,
    float: step >= 4,
    cup: step === 2,
    wires: true,
  }
}

function useDoseProgress(dosing, reduced) {
  const start = useRef(0)
  const progress = useRef(0)
  const previous = useRef(false)

  useFrame((state) => {
    if (dosing && !previous.current) start.current = state.clock.elapsedTime
    previous.current = dosing
    if (!dosing) {
      progress.current = 0
      return
    }
    progress.current = reduced
      ? 1
      : Math.min(1, (state.clock.elapsedTime - start.current) / (DOSE_MS / 1000))
  })

  return progress
}

function Shelf({ onMiss }) {
  return (
    <mesh position={[1, -0.07, -0.25]} receiveShadow onClick={onMiss}>
      <boxGeometry args={[3, 0.14, 1.9]} />
      <meshStandardMaterial color="#5c6794" roughness={0.46} metalness={0.38} />
    </mesh>
  )
}

function Room() {
  const legY = -0.46
  const legs = [
    [-0.4, legY, -1.1],
    [2.4, legY, -1.1],
    [-0.4, legY, 0.6],
    [2.4, legY, 0.6],
  ]

  return (
    <group>
      <color attach="background" args={['#0a0f24']} />
      <fog attach="fog" args={['#0a0f24', 8, 16]} />
      <hemisphereLight args={['#c9d2ff', '#1a1240', 0.85]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[3.4, 6.8, 4]}
        intensity={2.7}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00035}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-3.5, 2.2, -1.5]} intensity={0.55} color="#7b5cff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.86, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#070a1a" />
      </mesh>
      <mesh position={[0.2, 1.2, -1.72]} receiveShadow>
        <planeGeometry args={[9, 3.8]} />
        <meshStandardMaterial color="#121a38" />
      </mesh>
      <mesh position={[1.9, 1.55, -1.7]}>
        <planeGeometry args={[1.65, 1.1]} />
        <meshStandardMaterial color="#9eb6ff" emissive="#4cc3ff" emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[1.9, 1.55, -1.69]}>
        <boxGeometry args={[0.025, 1.1, 0.02]} />
        <meshStandardMaterial color="#2b3670" />
      </mesh>
      <mesh position={[1.9, 1.55, -1.69]}>
        <boxGeometry args={[1.65, 0.025, 0.02]} />
        <meshStandardMaterial color="#2b3670" />
      </mesh>
      {legs.map((position) => (
        <mesh key={position.join()} position={position} castShadow>
          <boxGeometry args={[0.08, 0.72, 0.08]} />
          <meshStandardMaterial color="#2b3670" metalness={0.35} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[-1.5, -0.52, 0.42]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.56, 1.25]} />
        <meshStandardMaterial color="#3a4578" roughness={0.42} metalness={0.32} />
      </mesh>
    </group>
  )
}

function Controls() {
  const { setHeld } = useGuide()
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minPolarAngle={0.35}
      maxPolarAngle={1.35}
      minDistance={2.4}
      maxDistance={16}
      target={TARGET}
      onStart={() => setHeld(true)}
    />
  )
}

function FrameCamera() {
  const { camera, size, controls } = useThree()
  const { held } = useGuide()
  const framed = useRef('')

  useLayoutEffect(() => {
    camera.fov = 36
    camera.updateProjectionMatrix()
  }, [camera])

  useFrame(() => {
    if (held || !controls) return
    const key = `${size.width}x${size.height}`
    if (framed.current === key) return
    const aspect = size.width / Math.max(size.height, 1)
    const vFov = THREE.MathUtils.degToRad(camera.fov)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const fit = Math.min(vFov, hFov)
    const distance = (2.55 / Math.tan(fit / 2)) * 1.2
    camera.position.copy(TARGET).addScaledVector(VIEW_OFFSET, distance)
    camera.near = 0.1
    camera.far = distance + 18
    camera.updateProjectionMatrix()
    controls.target.copy(TARGET)
    controls.update()
    framed.current = key
  })

  return null
}

function SceneContents() {
  const {
    profile,
    moisture,
    reservoirOk,
    dosing,
    reduced,
    chapter,
    buildStep,
    selected,
    choosePart,
  } = useGuide()
  const show = showFor(chapter, buildStep)
  const progress = useDoseProgress(dosing, reduced)
  const pumpHot = selected === 'pump'
  const potHot = selected === 'pot'
  const sensorHot = selected === 'sensor'

  return (
    <>
      <Room />
      <Shelf onMiss={() => choosePart(null)} />
      <Controls />

      <group visible={show.tank} position={LAYOUT.tank}>
        <Clickable id="tank" onSelect={choosePart}>
          <Tank
            hot={selected === 'tank'}
            floatHot={selected === 'float'}
            reservoirOk={reservoirOk}
            reduced={reduced}
          />
        </Clickable>
        <group visible={show.float}>
          <Clickable id="float" onSelect={choosePart}>
            <mesh position={[0.2, 0.72, 0]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </Clickable>
        </group>
      </group>

      <group visible={show.pumpA} position={LAYOUT.pumpA}>
        <Clickable id="pump" onSelect={choosePart}>
          <Pump hot={pumpHot} spinning={dosing && show.pumpA} />
        </Clickable>
      </group>
      <group visible={show.pumpB} position={LAYOUT.pumpB}>
        <Clickable id="pump" onSelect={choosePart}>
          <Pump hot={pumpHot} spinning={false} />
        </Clickable>
      </group>

      <group visible={show.potA} position={LAYOUT.potA}>
        <group visible={show.trayA}>
          <Tray hot={potHot} />
        </group>
        <Clickable id="pot" onSelect={choosePart}>
          <PotBody hot={potHot} />
          <Soil moisture={moisture} reduced={reduced} />
        </Clickable>
        <group visible={show.plantA} scale={1.25}>
          <Plant key={profile.plant} kind={profile.plant} reduced={reduced} />
        </group>
        <group visible={show.sensorA}>
          <Clickable id="sensor" onSelect={choosePart}>
            <Sensor hot={sensorHot} />
          </Clickable>
        </group>
      </group>

      <group visible={show.potB} position={LAYOUT.potB}>
        <group visible={show.trayB}>
          <Tray hot={potHot} />
        </group>
        <Clickable id="pot" onSelect={choosePart}>
          <PotBody hot={potHot} />
          <Soil moisture={18} reduced={reduced} />
        </Clickable>
        <group visible={show.plantB} scale={1.2}>
          <Plant kind="succulent" reduced={reduced} />
        </group>
        <group visible={show.sensorB}>
          <Clickable id="sensor" onSelect={choosePart}>
            <Sensor hot={sensorHot} />
          </Clickable>
        </group>
      </group>

      <group visible={show.cup} position={LAYOUT.potA}>
        <Cup progress={progress} />
      </group>

      <Hose points={HOSE_A} visible={show.hoseA} active={dosing && show.hoseA} />
      <Hose points={HOSE_B} visible={show.hoseB} active={false} />
      <Droplets points={HOSE_A} active={dosing && show.hoseA} reduced={reduced} />

      <group visible={show.pi} position={LAYOUT.pi}>
        <Clickable id="pi" onSelect={choosePart}>
          <PiBoard hot={selected === 'pi'} />
        </Clickable>
      </group>
      <group visible={show.adc} position={LAYOUT.adc}>
        <Clickable id="adc" onSelect={choosePart}>
          <AdcBoard hot={selected === 'adc'} />
        </Clickable>
      </group>
      <group visible={show.mosfet} position={LAYOUT.mosfet}>
        <Clickable id="mosfet" onSelect={choosePart}>
          <Mosfet hot={selected === 'mosfet'} />
        </Clickable>
      </group>
      <group visible={show.supply} position={LAYOUT.supply}>
        <Clickable id="supply" onSelect={choosePart}>
          <Supply hot={selected === 'supply'} />
        </Clickable>
      </group>

      {show.wires &&
        WIRES.map((wire) => {
          const related = !selected || wire.tags.includes(selected)
          const emphasize = chapter === 'wiring' || Boolean(selected)
          return (
            <Wire
              key={wire.id}
              points={wire.points}
              color={wire.color}
              hot={emphasize && related}
            />
          )
        })}
    </>
  )
}

export default function Bench() {
  const { choosePart } = useGuide()

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [3.4, 3.1, 5.6], fov: 36, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => choosePart(null)}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.setClearColor('#0a0f24')
      }}
    >
      <CursorReset />
      <FrameCamera />
      <SceneContents />
    </Canvas>
  )
}

function CursorReset() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const element = gl.domElement
    const reset = () => {
      document.body.style.cursor = ''
    }
    element.addEventListener('pointerleave', reset)
    return () => element.removeEventListener('pointerleave', reset)
  }, [gl])

  return null
}
