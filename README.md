# Void Runner.

Void Runner is a full-screen 3D parkour runner built with Three.js and Vite. Sprint across floating moon bridges, dodge hazards, jump broken paths, slide under gates, collect coins, and chain combos while the world accelerates.

## Features

- Full-bleed WebGL scene with a giant moon, stars, floating islands, fog, and animated sky bridge.
- Stylized human parkour runner built from 3D primitives.
- Lane movement, jump, slide, pause, restart, and mobile touch controls.
- Procedural hurdles, slide gates, pillars, bridge-gap markers, coins, and shield pickups.
- Coins, shields, combo multiplier, score, best score, pause, restart, and game-over flow.
- Responsive HUD designed for desktop and mobile.
- Local best-score persistence with `localStorage`.

## Controls

| Action | Input |
| --- | --- |
| Move left | `ArrowLeft` or `A` |
| Move right | `ArrowRight` or `D` |
| Jump | `ArrowUp` or `W` |
| Slide | `ArrowDown` or `S` |
| Pause | `Space` |
| Restart | `R` |

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Stack

- Vite
- Three.js
- Cannon dependency retained for future physics experiments
