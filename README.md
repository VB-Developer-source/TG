# Mumbai Local Train Simulator 3D — Section 02: Realistic Train Creation & Audio System

A professional, high-performance 3D browser-based Mumbai Local Train Simulator built with **Three.js**, **Vite**, **WebGL**, and procedural audio synthesis.

---

## 1. Section 02 Feature Summary

Section 02 adds a complete, authentic 3D Mumbai Suburban Electric Multiple Unit (EMU) train model, multi-coach train rake system, detailed mechanical components, passenger and driver cab interiors, interactive train lighting, a 360-degree showroom inspection scene, and a complete Web Audio engine.

### A. Realistic Mumbai Suburban EMU Train
- **Front Cab Face**:
  - Distinctive aerodynamic blunt nose curvature of Mumbai suburban EMUs.
  - Large wrap windshield with center divider pillar, black rubber weatherstripping, and windshield wipers.
  - Dual high-intensity headlights with warm spotlight projection and emissive glass lenses.
  - Red marker/tail lamps for rear driving coach.
  - Electronic LED Destination Display board ("FAST • BORIVALI / फास्ट • बोरिवली", "SLOW • KALYAN", etc.) with amber matrix backlight.
  - Under-cab cowcatcher / cattle guard with safety yellow and black hazard stripes.
- **Coach Body & Proportions**:
  - Authentic Indian Broad Gauge dimensions: width 3.66m, height 3.90m, coach length 21.3m.
  - Corrugated arched roof with longitudinal corrugations and mushroom exhaust ventilators.
  - 4 wide double-leaf sliding passenger doorways per side (the signature wide entrances of Mumbai suburban trains).
  - Passenger windows with the iconic **3-bar aluminum safety grilles**.
  - Ladies coach identification with yellow/green zebra bands and pink accents.
  - Underbody equipment: traction transformer boxes, air brake main reservoirs, battery trays, and motor cooling ducts.
  - Inter-coach flexible rubber gangway bellows and center couplers.

### B. Mechanical Systems
- **Bogies**:
  - Two suburban bogies per coach at 14.63m pivot centers.
  - Heavy cast-steel H-frame with side members and transoms.
  - Primary helical coil spring suspension above each axle box.
  - Secondary rubber air spring bellows supporting the coach bolster.
  - Brake cylinders and brake shoe levers positioned against wheel treads.
- **Wheels & Axles**:
  - 4 axles (8 wheels) per coach.
  - Flanged railway wheel geometry (0.952m diameter, 28mm flange, conical tread).
  - Wheels and axles are isolated in separate `Object3D` groups, ready for linear rotation and physics integration.
- **25kV AC Roof Pantograph**:
  - 4 brown porcelain post insulators on base frame.
  - Articulated lower and upper arms with knuckle joints.
  - Collector head pan with twin metallized carbon contact strips and curved horn ends reaching the 5.65m OHE contact wire.

### C. Passenger Coach & Driver Cab Interior
- **Passenger Saloon**:
  - Durable blue rexine 3x3 transverse and longitudinal bench seats.
  - Vertical stainless steel stanchion grab poles at every doorway and seat bank.
  - Longitudinal ceiling grab tubes with hanging handhold loops/straps down the center aisle.
  - Overhead wire-mesh luggage racks.
  - Rotary ceiling ventilation fans spaced along the saloon ceiling.
  - Bilingual suburban railway route map boards.
- **Driver Cabin**:
  - Ergonomic high-back driver seat.
  - Sloped control desk console with digital speedometer display and analog pressure dials (Brake Pipe, Main Reservoir, 25kV OHE Voltage).
  - Master controller traction throttle and dynamic brake levers.
  - Cab partition wall with passenger saloon.

### D. Multi-Coach Rake Architecture
- Configurable train lengths:
  - **3-Coach Showroom Rake**: Driving Motor Coach (DMC) + Trailer Coach (TC) + Driving Trailer Coach (DTC).
  - **12-Coach Full Suburban Rake**: 4 coupled 3-coach units forming the authentic 12-car Mumbai commuter rake.
- **Livery Themes**:
  - **Western Railway (WR)**: Violet/Purple + White/Cream cheatlines.
  - **Central Railway (CR)**: Crimson Maroon + Light Cream cheatlines.
  - **Harbour Line (HB)**: Deep Emerald Teal + Off-White cheatlines.
  - **Medha AC Local (AC)**: Silver Stainless Steel + Sky Blue cheatlines.

### E. Complete Sound System (`src/audio/`)
- **Procedural Web Audio API Architecture**:
  - `AudioManager`: Master bus with independent volume channels (`master`, `train`, `env`, `ui`) and mute toggle.
  - `TrainAudio`:
    - Authentic dual-tone pneumatic air horn (311 Hz Eb4 + 392 Hz G4 with resonant filter).
    - 3-Phase AC VVVF inverter singing whine and traction motor hum that modulates with speed ratio.
    - Pneumatic air brake release ("pssshh-chhh") and application friction squeal.
    - Door warning buzzer (3-pulse beep) and pneumatic sliding door movement.
    - Periodic rail joint clatter ("click-clack... click-clack") and rolling friction rumble.
    - Reciprocating air compressor pump cycle.
  - `EnvironmentAudio`:
    - Suburban station platform background ambience and breeze.
    - 4-note Indian Railways station announcement chime (D5 – F#5 – A5 – D6).
  - `UIAudio`:
    - Crisp button hover ticks, selection clicks, and transition chimes.

### F. Dedicated 3D Train Showroom & Preview Screen
- Accessible via **TRAIN SELECT** or the **3D Showroom** HUD button.
- 360-degree free orbital camera with mouse drag rotation and mouse wheel zoom.
- 7 Camera Presets:
  - **Front Cab**: Windshield, twin headlights, cowcatcher, and destination LED.
  - **Side Profile**: Doors, windows with safety bars, and livery bands.
  - **Rear Cab**: Rear driving coach with red tail marker lights.
  - **Bogie & Wheels**: Close-up of wheels, axles, springs, and air brakes.
  - **Passenger Saloon**: Eye-level interior view looking down the aisle.
  - **Driver Desk**: Console dashboard, speedometer, and master controller.
  - **360° Free Orbit**: Free inspection turntable orbit.
- Live interactive toggles for **Headlights**, **Interior Lights**, **Sliding Doors** (with audio), and sound tests.
- **Audio Mixer Modal** with channel sliders and live test rack, persisted in `localStorage`.

---

## 2. Directory Structure

```
src/
  train/
    TrainConfig.ts         # Proportions, gauge (1676mm), and line livery themes
    Wheels.ts              # Flanged broad-gauge wheels and rotating axle groups
    Bogie.ts               # H-frame, coil/air spring suspension, brake shoes
    Pantograph.ts          # 25kV AC roof insulators, articulated arms, collector pan
    TrainExterior.ts       # Aerodynamic cab nose, sliding doors, window safety bars
    TrainInterior.ts       # 3x3 saloon seating, stanchion poles, grab straps, driver desk
    TrainLights.ts         # Front spotlights, red tail markers, saloon downlights
    Coach.ts               # Modular coach assembling exterior, interior, bogies, lights
    TrainBuilder.ts        # Factory for 12-car rakes and 3-car showroom rakes
    Train.ts               # Multi-coach train rake coordinator and animation updates
  audio/
    AudioManager.ts        # Central audio graph, gain busses, localStorage persistence
    TrainAudio.ts          # Pneumatic horn, VVVF motor inverter, air brakes, doors, clatter
    EnvironmentAudio.ts    # Station platform ambient drone and announcement chime
    UIAudio.ts             # Button hover, click, and transition feedback
  scenes/
    BootScene.ts           # Asset preheating and loading screen stream
    MainMenuScene.ts       # 3D platform background with stationed 12-car train
    TrainPreviewScene.ts   # 360 showroom turntable with orbital camera and presets
  ui/
    LoadingScreen.ts       # Railway loading screen
    MainMenu.ts            # Sidebar navigation, route/train selectors, HUD controls
    TrainPreviewUI.ts      # Showroom inspection dock, livery switcher, sound test rack
    AudioSettings.ts       # Audio mixer modal with channel sliders and sound tests
    SettingsMenu.ts        # Simulator settings modal
  core/
    Game.ts                # Engine coordinator and scene manager
    Renderer.ts            # WebGL renderer with ACESFilmic & PCFSoftShadowMap
    Camera.ts              # Damped multi-mode camera system
    Lighting.ts            # Realistic sunlight, shadows, time-of-day cycles
    World.ts               # Procedural tracks, OHE catenary, Dadar platform 1
    AssetManager.ts        # Procedural canvas textures
```

---

## 3. Section 02 Verification & Testing Report

| Test Item | Status | Verification Detail |
|---|---|---|
| **1. Train preview opens** | PASSED | Launches via "TRAIN SELECT" modal or "3D Showroom" button without errors. |
| **2. Train model renders correctly** | PASSED | Authentic Mumbai EMU aerodynamic cab, destination board, roof corrugations, and safety bars. |
| **3. Multiple connected coaches** | PASSED | Modular coaches linked with flexible gangway bellows and couplers (3-car and 12-car rakes). |
| **4. Wheels, bogies & pantograph visible** | PASSED | Flanged wheels, coil/air spring suspension, brake cylinders, and 25kV roof pantograph rendered. |
| **5. Interior preview works** | PASSED | Passenger Saloon camera displays 3x3 seats, handrails, grab straps, and fans; Driver Cab camera displays dashboard. |
| **6. Camera rotates around train** | PASSED | Pointer drag rotates 360° around the train smoothly with exponential damping. |
| **7. Camera zoom works** | PASSED | Mouse wheel zooms smoothly between 3.5m and 85m clamp range. |
| **8. Headlights work** | PASSED | Front spotlights illuminate tracks and emissive lens glow toggles ON/OFF. |
| **9. Interior lights work** | PASSED | Saloon downlights and fluorescent tube fixtures toggle ON/OFF. |
| **10. Horn produces audible sound** | PASSED | Synthesizes authentic WAP-7 / EMU dual-tone pneumatic horn (311Hz/392Hz). |
| **11. Motor sound preview works** | PASSED | 3-Phase AC VVVF inverter singing whine and traction hum toggles and modulates. |
| **12. Brake & door sounds work** | PASSED | Pneumatic air release ("pssshh"), brake squeal, and 3-pulse door warning buzzer play crisply. |
| **13. Menu sounds work** | PASSED | UI button hover ticks, selection clicks, and confirmation chimes function across all menus. |
| **14. Audio volume controls work** | PASSED | Master, Train, Environment, and UI volume sliders adjust real-time gain nodes. |
| **15. Mute / unmute works** | PASSED | Master mute switch silences all output while retaining individual channel levels. |
| **16. Audio settings persist after reload**| PASSED | Channel volumes and mute state are stored in `localStorage`. |
| **17. No console errors** | PASSED | Clean runtime with zero unhandled exceptions, zero 404s, and strict TypeScript compilation. |
| **18. Section 01 features preserved** | PASSED | Dadar Platform 1, tracks, OHE catenary, day/night cycle, free camera, and main menu continue working seamlessly. |

---

## 4. Known Limitations & Next Steps (Section 03 Preview)

- **Driving Physics**: Wheels, motor pitch, and door actuators are fully wired to receive speed and state inputs, but player train throttle/braking kinematics are deliberately reserved for Section 03 per project requirements.
- **Route Movement**: Train is positioned in the 360 showroom and stationed at Dadar Platform 1; station-to-station line travel will be introduced in future route sections.
- **Passenger AI**: Passenger saloon and platforms are equipped with seating and safety tiles, ready for commuter crowd dynamics in Section 04.

---

## 5. Build Verification

- **TypeScript Compilation (`npm run lint`)**: Passed with 0 errors.
- **Vite Production Build (`npm run build`)**: Passed with exit code 0 (`dist/index.html`, `dist/assets/`).
