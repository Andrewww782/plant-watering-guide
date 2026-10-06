import { Component, useEffect, useId, useRef, useState } from 'react'
import Bench from './scene/Bench'
import { GuideContext } from './guide'
import { CONFIG_SAMPLE, NAV, PARTS, STEPS } from './content'
import {
  DOSE_MS,
  ML_PER_SECOND,
  PROFILES,
  doseSeconds,
  evaluate,
  formatGap,
  moisturePercent,
  profileById,
} from './logic'

const INITIAL_NOTE =
  'The main pot is a pothos at 26%. Three dry checks, 60 hours since a drink, nothing given today, and a full tank. Every gate is open.'

function firstSentence(text) {
  const cut = text.indexOf('. ')
  return cut === -1 ? text : text.slice(0, cut + 1)
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

class ShelfBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="viewport-fallback">
          WebGL did not start. The guide beside the shelf still stands on its own.
        </p>
      )
    }
    return this.props.children
  }
}

function ProfileChoices({ profileId, setProfileId }) {
  return (
    <div className="choices" role="group" aria-label="Plant profile">
      {PROFILES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={item.id === profileId}
          onClick={() => setProfileId(item.id)}
        >
          {item.name}
        </button>
      ))}
    </div>
  )
}

function Field({ label, hint, children }) {
  const id = useId()
  return (
    <label htmlFor={id}>
      <span>{label}</span>
      {hint ? <small>{hint}</small> : null}
      {children(id)}
    </label>
  )
}

function Calibration() {
  const [dry, setDry] = useState(26000)
  const [wet, setWet] = useState(11000)
  const [raw, setRaw] = useState(18500)
  const percent = moisturePercent(raw, dry, wet)
  const swapped = dry < wet

  return (
    <div className="cal">
      <Field label="Dry raw">
        {(id) => (
          <input
            id={id}
            type="number"
            value={dry}
            onChange={(event) => setDry(Number(event.target.value))}
          />
        )}
      </Field>
      <Field label="Wet raw">
        {(id) => (
          <input
            id={id}
            type="number"
            value={wet}
            onChange={(event) => setWet(Number(event.target.value))}
          />
        )}
      </Field>
      <Field label="Reading">
        {(id) => (
          <input
            id={id}
            type="number"
            value={raw}
            onChange={(event) => setRaw(Number(event.target.value))}
          />
        )}
      </Field>
      <p>
        {percent == null
          ? 'Dry and wet have to be different numbers.'
          : `That reading is ${percent}% moisture.`}
        {swapped
          ? ' On most capacitive boards the dry raw value is the higher one. If your probe reads the other way, keep the higher number as dry.'
          : ''}
      </p>
    </div>
  )
}

export default function App() {
  const reduced = useReducedMotion()
  const [profileId, setProfileId] = useState('tropical')
  const [moisture, setMoisture] = useState(26)
  const [dryStreak, setDryStreak] = useState(3)
  const [hours, setHours] = useState(60)
  const [mlToday, setMlToday] = useState(0)
  const [reservoirOk, setReservoirOk] = useState(true)
  const [dosing, setDosing] = useState(false)
  const [note, setNote] = useState(INITIAL_NOTE)
  const [chapter, setChapter] = useState('overview')
  const [buildStep, setBuildStep] = useState(1)
  const [selected, setSelected] = useState(null)
  const [held, setHeld] = useState(false)
  const alive = useRef(true)
  const doseTimer = useRef(0)
  const chapterPin = useRef(0)
  const profile = profileById(profileId)

  const result = evaluate({
    moisture,
    threshold: profile.wetBelow,
    dryStreak,
    hoursSince: hours,
    minHours: profile.minHours,
    mlToday,
    doseMl: profile.doseMl,
    dailyCap: profile.dailyCap,
    reservoirOk,
  })
  const timing = doseSeconds(profile.doseMl)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      window.clearTimeout(doseTimer.current)
    }
  }, [])

  useEffect(() => {
    const nodes = [...document.querySelectorAll('main section[id]')]
    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < chapterPin.current) return
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit?.target.id) setChapter(hit.target.id)
      },
      { rootMargin: '-18% 0px -52% 0px', threshold: [0.15, 0.35, 0.6] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  function choosePart(id) {
    setSelected((current) => {
      if (id == null) return null
      return current === id ? null : id
    })
  }

  function pickStep(step) {
    chapterPin.current = performance.now() + 900
    setBuildStep(step)
    setChapter('build')
  }

  function resetLog() {
    if (dosing) return
    setMoisture(26)
    setDryStreak(3)
    setHours(60)
    setMlToday(0)
    setReservoirOk(true)
    setNote('Log cleared. Three dry readings, 60 hours since a drink, nothing given today, tank full.')
  }

  function runCheck() {
    if (dosing) return
    if (!result.drink) {
      setNote('No dose. A shut gate is enough to keep the pump off.')
      return
    }
    const sent = profile.doseMl
    setDosing(true)
    setNote(
      `Sending ${sent} ml. At ${ML_PER_SECOND} ml per second that is about ${Math.round(timing.applied)} seconds. The soil color waits while the water travels.`,
    )
    doseTimer.current = window.setTimeout(() => {
      if (!alive.current) return
      setDosing(false)
      setMlToday((value) => value + sent)
      setHours(0)
      setDryStreak(1)
      setMoisture((value) => Math.min(96, value + Math.round(sent * 0.4)))
      setNote(`Sent ${sent} ml. The gap and today’s log both moved. Run the check again.`)
    }, reduced ? 500 : DOSE_MS)
  }

  const selectedPart = PARTS.find((part) => part.id === selected)
  const caption = selectedPart
    ? `${selectedPart.name}. ${firstSentence(selectedPart.text)}`
    : 'Drag to turn the shelf. The main pot uses the numbers in the guide.'

  const guide = {
    profile,
    profileId,
    moisture,
    reservoirOk,
    dosing,
    reduced,
    chapter,
    buildStep,
    selected,
    choosePart,
    held,
    setHeld,
  }

  return (
    <GuideContext.Provider value={guide}>
      <a className="skip" href="#overview">
        Skip to the guide
      </a>
      <header className="top">
        <a className="brand" href="#overview">
          Measured drinks
        </a>
        <nav className="nav" aria-label="Guide">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={chapter === id ? 'true' : undefined}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <div className="stage">
        <div className="viewport" id="shelf">
          <div className="viewport-bar">
            <span>~/bench</span>
            <span className="viewport-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="viewport-stage">
            <p className="sr-only">
              A WebGL shelf with a low water tank, two peristaltic pumps, two pots, soil probes, and a
              Raspberry Pi. Water moves along the tube only when a dose is sent.
            </p>
            <ShelfBoundary>
              <Bench />
            </ShelfBoundary>
            <p className="viewport-caption">{caption}</p>
          </div>
        </div>
        <main>
          <section id="overview" className="prose">
            <h1>Each pot gets its own drink.</h1>
            <p className="lede">
              A Raspberry Pi reads the soil. The kind of plant decides whether water is allowed, and
              how many milliliters leave the tank. The pump runs for a counted time, then it stops.
            </p>
            <p>
              A drink is that counted dose. Stop on the timer. If the pump waits until the probe says
              wet, a small pot floods: the water is still on its way to the sensor.
            </p>
            <p>
              The shelf shows the whole idea at once. The tank sits lower than the pots, so a resting
              tube cannot siphon the reservoir downhill. The near pot is the one the numbers control.
              The far pot is a succulent on a long gap. It shares the water and stays put when the
              near pot drinks. One pump runs at a time.
            </p>
          </section>

          <section id="plants" className="prose">
            <h2>The plant sets four numbers</h2>
            <p>
              A profile is a line, a dose, a gap, and a daily cap. Soil mix moves the probe more than
              the species name does, so treat these as the place you start, then tune one number at a
              time.
            </p>
            <ProfileChoices profileId={profileId} setProfileId={setProfileId} />
            <p>
              Leave the moisture slider where it is and switch profiles. The same reading can be a
              drink for a fern and a refusal for a succulent. The shelf’s main plant changes shape
              with the profile. {profile.guidance}
            </p>
            <dl className="plant-list">
              <div>
                <dt>Thirsty herb</dt>
                <dd>Basil, mint, parsley. Water below 40%. One dose 40–60 ml. Gap 12 hours. Daily cap 100 ml.</dd>
              </div>
              <div>
                <dt>Tropical foliage</dt>
                <dd>Pothos, philodendron, peace lily. Water below 30%. One dose 40–70 ml. Gap 2 days. Daily cap 80 ml.</dd>
              </div>
              <div>
                <dt>Fern</dt>
                <dd>Boston fern. Water below 50%. One dose about 50 ml. Gap 1 day. Daily cap 100 ml.</dd>
              </div>
              <div>
                <dt>Succulent</dt>
                <dd>Snake plant, echeveria, cactus. Water below 15%. One dose 20–30 ml. Gap 7–14 days. Daily cap 40 ml.</dd>
              </div>
            </dl>
            <p>
              The shelf uses a single number inside each range: {profile.doseMl} ml, a line at{' '}
              {profile.wetBelow}%, a gap of {formatGap(profile.minHours)}, and a daily cap of{' '}
              {profile.dailyCap} ml. Orchids in bark, and any plant you cannot bear to lose, stay on a
              watering can until this bench has been dull for a month. Start with a pothos or a basil.
            </p>
          </section>

          <section id="decision" className="prose">
            <h2>Five gates, then a counted dose</h2>
            <p>
              Every ten minutes the Pi takes several readings and keeps the median. A dose is queued
              only when all five gates pass. After the dose, ignore that pot for about an hour so the
              water can spread before the probe is trusted again.
            </p>
            <div className="lab">
              <ProfileChoices profileId={profileId} setProfileId={setProfileId} />
              <Field
                label={<span>Moisture <strong>{moisture}%</strong></span>}
                hint={`This plant’s line is ${profile.wetBelow}%.`}
              >
                {(id) => (
                  <input
                    id={id}
                    type="range"
                    min="0"
                    max="100"
                    value={moisture}
                    onChange={(event) => setMoisture(Number(event.target.value))}
                  />
                )}
              </Field>
              <Field
                label={<span>Dry readings in a row <strong>{dryStreak}</strong></span>}
                hint="The program wants 3 before it will believe the soil."
              >
                {(id) => (
                  <input
                    id={id}
                    type="range"
                    min="0"
                    max="5"
                    value={dryStreak}
                    onChange={(event) => setDryStreak(Number(event.target.value))}
                  />
                )}
              </Field>
              <Field
                label={<span>Hours since a drink <strong>{hours >= 48 ? `${hours} (${formatGap(hours)})` : hours}</strong></span>}
                hint={`Minimum gap for this plant: ${formatGap(profile.minHours)}.`}
              >
                {(id) => (
                  <input
                    id={id}
                    type="range"
                    min="0"
                    max="360"
                    value={hours}
                    onChange={(event) => setHours(Number(event.target.value))}
                  />
                )}
              </Field>
              <Field
                label={<span>Already given today <strong>{mlToday} ml</strong></span>}
                hint={`A ${profile.doseMl} ml dose has to fit under ${profile.dailyCap} ml.`}
              >
                {(id) => (
                  <input
                    id={id}
                    type="range"
                    min="0"
                    max="140"
                    value={mlToday}
                    onChange={(event) => setMlToday(Number(event.target.value))}
                  />
                )}
              </Field>
              <div className="row">
                <button
                  type="button"
                  className="ghost"
                  aria-pressed={reservoirOk}
                  onClick={() => setReservoirOk((value) => !value)}
                >
                  {reservoirOk ? 'Tank has water' : 'Tank is empty'}
                </button>
              </div>
              <ul className="gates">
                {result.gates.map((gate) => (
                  <li key={gate.id} className={gate.pass ? 'pass' : 'fail'}>
                    <span className="mark" aria-hidden="true">
                      {gate.pass ? '✓' : '–'}
                    </span>
                    <div>
                      <strong>{gate.title}</strong>
                      <p>{gate.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="quiet">
                This dose is {profile.doseMl} ml, about {Math.round(timing.applied)} seconds at{' '}
                {ML_PER_SECOND} ml per second.
                {timing.capped ? ' That run would be cut at 90 seconds.' : ' Any run past 90 seconds is cut.'}
              </p>
              <p className="note" aria-live="polite">
                {note}
              </p>
              <div className="row">
                <button type="button" className="primary" onClick={runCheck} disabled={dosing}>
                  {dosing ? 'Sending the dose' : 'Run a check'}
                </button>
                <button type="button" className="ghost" onClick={resetLog} disabled={dosing}>
                  Reset the log
                </button>
              </div>
            </div>
          </section>

          <section id="parts" className="prose">
            <h2>What goes on the bench</h2>
            <p>
              Select a part here or on the shelf. For four pots, the pieces beyond the Pi usually land
              around $120–200.
            </p>
            <div className="parts">
              {PARTS.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  aria-pressed={selected === part.id}
                  onClick={() => choosePart(part.id)}
                >
                  <strong>{part.name}</strong>
                  <span>{part.text}</span>
                </button>
              ))}
            </div>
          </section>

          <section id="wiring" className="prose">
            <h2>Two supplies, one ground</h2>
            <p>
              Power the Pi from its own official supply. Power the ADS1115 and the probes from the
              Pi’s 3.3 V pin. A probe fed from 5 V can push more than 3.3 V back into the converter.
            </p>
            <p>
              SDA goes to GPIO 2, physical pin 3. SCL goes to GPIO 3, physical pin 5. Tie the pump
              supply’s ground to the Pi’s ground. Switch the 12 V side of each pump through the
              MOSFET or through the relay’s normally open contact, so a pin that is idle leaves the
              pump off.
            </p>
            <p>
              Many relay boards turn on when the pin is low, and a Pi pin can float while the board
              boots. Set the off level in software before anything else, and set the pin’s power-on
              state in the boot configuration. The test is physical: reboot several times with the
              pump connected. It stays still.
            </p>
            <p>
              On the wiring chapter the leads brighten. Yellow is the probe, cream is I2C, orange is
              the motor drive, red is 12 V. Pick a part and the unrelated leads drop back.
            </p>
          </section>

          <section id="software" className="prose">
            <h2>A small Python service</h2>
            <p>
              Raspberry Pi OS Lite, a Python program, and a systemd unit so the loop starts on boot
              and comes back if it crashes. Keep the plants in a config file. Keep every reading and
              every dose in SQLite: time, plant, raw value, percent, milliliters, and why a drink was
              skipped.
            </p>
            <pre>
              <code>{CONFIG_SAMPLE}</code>
            </pre>
            <h3>Calibrate each probe in the mix you will use</h3>
            <p>
              Dry is that mix, bone dry. Wet is the same mix watered until it just drips. Most
              capacitive boards read higher when dry and lower when wet. Confirm the direction on
              yours and store both raw numbers.
            </p>
            <p className="formula">percent = (dry raw − reading) ÷ (dry raw − wet raw) × 100</p>
            <Calibration />
            <h3>Measure each pump</h3>
            <p>
              Run it for 10 seconds into a cup, three times, and store that pump’s own milliliters per
              second. Pumps of the same model do not match. Seconds to run are the dose divided by
              that rate, and the program refuses a run longer than 90 seconds even if the config asks.
            </p>
            <h3>The loop</h3>
            <ol className="loop">
              <li>Every ten minutes, read each channel several times and keep the median.</li>
              <li>Convert to percent with that probe’s dry and wet raw values.</li>
              <li>If all five gates pass, add the pot to a queue.</li>
              <li>Run the queue one pump at a time, and cap every run at 90 seconds.</li>
              <li>Turn the pump off in a finally block, so an error cannot leave it running.</li>
              <li>Write the dose to the log and ignore that pot for about an hour.</li>
            </ol>
            <p>
              Two alerts are worth adding once the loop is dull: the float says the tank is empty, or
              a probe sits on the same raw value for a day, or the moisture does not rise after a
              dose. The first is an empty tank. The others are a loose wire or a blocked tube.
            </p>
          </section>

          <section id="build" className="prose">
            <h2>Build one channel before you own eight</h2>
            <p>The shelf adds the pieces for the step you select. Stay with a step until it is boring.</p>
            <ol className="steps">
              {STEPS.map((step) => (
                <li key={step.n}>
                  <button
                    type="button"
                    aria-pressed={chapter === 'build' && buildStep === step.n}
                    onClick={() => pickStep(step.n)}
                  >
                    <strong>
                      <span className="step-n">{step.n}</span>
                      {step.title}
                    </strong>
                    <span>{step.body}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section id="safety" className="prose">
            <h2>Before you leave it alone</h2>
            <p className="safety-lead">
              A crashed program, a stuck relay, or a bad config can empty the tank into one pot.
            </p>
            <p>
              Four limits hold that back. The float switch cuts 12 V when the tank is empty. Every run
              has a hard time cap. Every pot has a daily milliliter cap. Every pot sits in a tray that
              can hold a spill. The first week is for calibration: keep the cap small, read the log
              each evening, and change one number at a time.
            </p>
            <p>
              Plain water only, until the doses are right. Outdoors, the electronics stay in a dry box.
              The pots can be outside. The Pi should not.
            </p>
          </section>
        </main>
      </div>
    </GuideContext.Provider>
  )
}
