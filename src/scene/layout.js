// Upper shelf top is y = 0. Its footprint is x -0.5..2.5, z -1.2..0.7.
// Tank and pumps sit on a lower plinth (top y = -0.24) in front-left,
// clear of that footprint, so the tubes have to climb.

export const LAYOUT = {
  potA: [0.95, 0, -0.18],
  potB: [1.4, 0, 0.32],
  pumpA: [-1.15, -0.24, 0.12],
  pumpB: [-0.95, -0.24, 0.62],
  tank: [-1.9, -0.24, 0.38],
  pi: [-0.15, 0, -0.9],
  adc: [0.45, 0, -0.82],
  mosfet: [-1.4, -0.24, -0.02],
  supply: [-2.05, -0.24, 0.82],
}

function mid(a, b, y) {
  return [(a[0] + b[0]) / 2, y, (a[2] + b[2]) / 2]
}

export function hoseBetween(from, to) {
  const [x1, y1, z1] = from
  const [x2, , z2] = to
  const start = [x1 + 0.22, y1 + 0.34, z1]
  const end = [x2, 0.4, z2]
  return [start, mid(start, end, 0.78), [x2, 0.64, z2], end]
}

export const HOSE_A = hoseBetween(LAYOUT.pumpA, LAYOUT.potA)
export const HOSE_B = hoseBetween(LAYOUT.pumpB, LAYOUT.potB)

function arc(a, b, lift) {
  return [a, mid(a, b, Math.max(a[1], b[1]) + lift), b]
}

const SENSOR_TOP = [LAYOUT.potA[0] + 0.22, 0.62, LAYOUT.potA[2] + 0.1]
const ADC_TOP = [LAYOUT.adc[0], 0.2, LAYOUT.adc[2] + 0.1]
const PI_HEADER = [LAYOUT.pi[0] + 0.12, 0.38, LAYOUT.pi[2] + 0.16]
const MOSFET_TOP = [LAYOUT.mosfet[0], 0.02, LAYOUT.mosfet[2]]
const PUMP_A_TERMINAL = [LAYOUT.pumpA[0], 0.08, LAYOUT.pumpA[2] - 0.16]
const SUPPLY_POST = [LAYOUT.supply[0] + 0.1, 0.02, LAYOUT.supply[2]]

export const WIRES = [
  { id: 'sense', color: '#E2B340', tags: ['sensor', 'adc'], points: arc(SENSOR_TOP, ADC_TOP, 0.18) },
  { id: 'i2c', color: '#F4F0E2', tags: ['adc', 'pi'], points: arc(ADC_TOP, PI_HEADER, 0.12) },
  { id: 'gpio', color: '#E07A3D', tags: ['pi', 'mosfet'], points: arc(PI_HEADER, MOSFET_TOP, 0.22) },
  { id: 'motor', color: '#E07A3D', tags: ['mosfet', 'pump'], points: arc(MOSFET_TOP, PUMP_A_TERMINAL, 0.14) },
  { id: 'power', color: '#C4473A', tags: ['supply', 'mosfet'], points: arc(SUPPLY_POST, MOSFET_TOP, 0.16) },
]
