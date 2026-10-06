export const ML_PER_SECOND = 1.4
export const RUN_CAP_SECONDS = 90
export const DOSE_MS = 4200

export const PROFILES = [
  {
    id: 'herb',
    name: 'Thirsty herb',
    examples: 'Basil, mint, parsley',
    wetBelow: 40,
    doseMl: 50,
    doseRange: '40–60 ml',
    minHours: 12,
    dailyCap: 100,
    plant: 'basil',
    guidance: 'Smaller drinks, more often. Let the mix dry a little, then stop it from sitting bone dry.',
  },
  {
    id: 'tropical',
    name: 'Tropical foliage',
    examples: 'Pothos, philodendron, peace lily',
    wetBelow: 30,
    doseMl: 55,
    doseRange: '40–70 ml',
    minHours: 48,
    dailyCap: 80,
    plant: 'pothos',
    guidance: 'One measured drink after the soil has stayed dry for a couple of days.',
  },
  {
    id: 'fern',
    name: 'Fern',
    examples: 'Boston fern',
    wetBelow: 50,
    doseMl: 50,
    doseRange: 'about 50 ml',
    minHours: 24,
    dailyCap: 100,
    plant: 'fern',
    guidance: 'Ferns collapse when the mix swings dry. Keep the line high.',
  },
  {
    id: 'succulent',
    name: 'Succulent',
    examples: 'Snake plant, echeveria, cactus',
    wetBelow: 15,
    doseMl: 25,
    doseRange: '20–30 ml',
    minHours: 168,
    dailyCap: 40,
    plant: 'succulent',
    guidance: 'Start with a long gap. A week is the short end. Some of these want two.',
  },
]

export function profileById(id) {
  return PROFILES.find((profile) => profile.id === id) ?? PROFILES[1]
}

export function formatGap(hours) {
  if (hours < 48) return `${hours} hours`
  const days = hours / 24
  const label = Number.isInteger(days) ? String(days) : days.toFixed(1)
  return `${label} ${days === 1 ? 'day' : 'days'}`
}

export function moisturePercent(raw, dryRaw, wetRaw) {
  if (![raw, dryRaw, wetRaw].every(Number.isFinite)) return null
  if (dryRaw === wetRaw) return null
  const percent = ((dryRaw - raw) / (dryRaw - wetRaw)) * 100
  return Math.round(Math.max(0, Math.min(100, percent)))
}

export function doseSeconds(doseMl, mlPerSecond = ML_PER_SECOND, cap = RUN_CAP_SECONDS) {
  const seconds = doseMl / mlPerSecond
  return {
    seconds,
    applied: Math.min(seconds, cap),
    capped: seconds > cap,
  }
}

export function evaluate({
  moisture,
  threshold,
  dryStreak,
  hoursSince,
  minHours,
  mlToday,
  doseMl,
  dailyCap,
  reservoirOk,
}) {
  const gates = [
    {
      id: 'moisture',
      title: 'Below the line',
      pass: moisture < threshold,
      detail:
        moisture < threshold
          ? `${moisture}% is under this plant’s ${threshold}% line.`
          : `${moisture}% is still at or above ${threshold}%. The pot waits.`,
    },
    {
      id: 'confirm',
      title: 'Three dry checks',
      pass: dryStreak >= 3,
      detail:
        dryStreak >= 3
          ? `${dryStreak} readings in a row agree the soil is dry.`
          : dryStreak === 0
            ? 'No dry readings yet. One noisy spike is not allowed to start a pump.'
            : `${dryStreak} dry ${dryStreak === 1 ? 'reading' : 'readings'} in a row. The program waits for 3.`,
    },
    {
      id: 'gap',
      title: 'Minimum gap',
      pass: hoursSince >= minHours,
      detail:
        hoursSince >= minHours
          ? `${hoursSince} hours since the last drink. This plant’s gap is ${formatGap(minHours)}.`
          : `Only ${hoursSince} hours since the last drink. This plant waits ${formatGap(minHours)}.`,
    },
    {
      id: 'cap',
      title: 'Daily cap',
      pass: mlToday + doseMl <= dailyCap,
      detail:
        mlToday + doseMl <= dailyCap
          ? `${mlToday} ml already given. A ${doseMl} ml dose still fits under ${dailyCap} ml.`
          : `${mlToday} ml already given. Another ${doseMl} ml would pass the ${dailyCap} ml cap.`,
    },
    {
      id: 'tank',
      title: 'Tank has water',
      pass: Boolean(reservoirOk),
      detail: reservoirOk
        ? 'The float says the tank has water.'
        : 'The float is open. Pump power is cut, and the program skips the drink.',
    },
  ]

  return { gates, drink: gates.every((gate) => gate.pass) }
}
