export const NAV = [
  ['overview', 'Overview'],
  ['plants', 'Plants'],
  ['decision', 'Gates'],
  ['parts', 'Parts'],
  ['wiring', 'Wiring'],
  ['software', 'Software'],
  ['build', 'Build'],
  ['safety', 'Safety'],
]

export const PARTS = [
  {
    id: 'sensor',
    name: 'Capacitive probe',
    text: 'One coated probe per pot. It senses water in the soil without passing a current through it, so it does not corrode the way a cheap resistive probe does. Power it from 3.3 V. Bury only the probe, in the root zone, away from the drip and away from the pot wall.',
  },
  {
    id: 'adc',
    name: 'ADS1115',
    text: 'A Pi has no analog pins. This board turns the probe voltage into a number over I2C. One ADS1115 reads four pots. A second board, set to another address, reads the next four. SDA is GPIO 2, physical pin 3. SCL is GPIO 3, physical pin 5.',
  },
  {
    id: 'pi',
    name: 'Raspberry Pi',
    text: 'Any 40-pin Pi can run the loop. A Pi Zero 2 W is enough for watering. Use a Pi 4 or 5 if you also want a camera or a dashboard. Give the Pi its own supply. That supply does not run the pumps.',
  },
  {
    id: 'pump',
    name: 'Peristaltic pump',
    text: 'One pump per pot, drawing from one shared tank of plain water. Run one pump at a time. A peristaltic pump has a steady flow, so seconds become milliliters, and a stopped pump blocks the tube.',
  },
  {
    id: 'mosfet',
    name: 'MOSFET or relay',
    text: 'The GPIO pin switches a driver. It does not feed the motor. Use a normally open contact so the pump is off while the pin is idle. Set that off level in the program before anything else, and set the pin’s state at boot. Reboot with the pump plugged in and watch that it never twitches.',
  },
  {
    id: 'supply',
    name: '12 V supply',
    text: 'A separate supply, sized for a single pump, with the grounds tied to the Pi. Do not borrow the Pi’s 5 V pin for the motors.',
  },
  {
    id: 'tank',
    name: 'Reservoir',
    text: 'Keep the tank lower than the pots so a resting tube cannot siphon the reservoir into the soil. A check valve is extra insurance. Leave fertilizer out of the shared tank until the plain-water doses have been dull and correct for a few weeks.',
  },
  {
    id: 'float',
    name: 'Float switch',
    text: 'Put it in series with the 12 V feed, and also read it from a GPIO pin. An empty tank then cuts pump power even if the program is wrong, and the log can say why a drink was skipped.',
  },
  {
    id: 'pot',
    name: 'Pot and tray',
    text: 'The tray under each pot should be able to hold a spilled tank. For four small pots, the parts beyond the Pi usually land around $120–200.',
  },
]

export const STEPS = [
  {
    n: 1,
    title: 'One probe, no water',
    body: 'Wire one capacitive sensor through the ADS1115. Write down the raw value in air, in dry mix, and in wet mix. Leave it in a pot overnight and confirm the number sits still.',
  },
  {
    n: 2,
    title: 'One pump, into a cup',
    body: 'Run that pump for 10 seconds into a measuring cup, three times, and store the average milliliters per second. Ask for 30 ml, then 50 ml, and check the cup. Reboot the Pi with the pump connected. It has to stay off.',
  },
  {
    n: 3,
    title: 'One plant, supervised',
    body: 'Move the tube into one pot and let the program decide, with you in the room. A drink should happen only after three dry readings, and the next one should be blocked by the gap.',
  },
  {
    n: 4,
    title: 'Float and trays',
    body: 'Set the pots in trays that can hold a full tank. The float has to cut 12 V when the water is low. Pull the sensor wire and confirm the program skips the drink instead of running the pump.',
  },
  {
    n: 5,
    title: 'The next pot',
    body: 'Add one channel at a time. Each pot gets its own probe, its own pump, and its own profile. Only one pump runs at once.',
  },
  {
    n: 6,
    title: 'A week on a short leash',
    body: 'Keep the daily cap small and read the log each evening. Change one number at a time: the line, the dose, or the gap. Raise a dose only when the soil looks right and the tray is dry.',
  },
  {
    n: 7,
    title: 'Extras, after the pumps are boring',
    body: 'A status page, a phone alert, a camera. If a pot is outdoors, the Pi and the pumps still live in a dry box with sealed cable entries.',
  },
]

export const CONFIG_SAMPLE = `plants:
  - id: basil_1
    profile: thirsty_herb
    sensor_channel: 0
    pump_gpio: 17
    dose_ml: 50
    min_interval_hours: 12
    max_ml_per_day: 100
    wet_below_percent: 40
    ml_per_second: 1.4
    dry_raw: 26000
    wet_raw: 11000`
