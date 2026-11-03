# Legacy Code Archive (Milestones 01 & 02)

This directory contains preserved, recoverable historical modules from earlier milestones:
- `core/`: Vanilla JavaScript / OOP engine (Game, Renderer, Camera, Lighting, World, AssetManager)
- `scenes/`: Legacy BootScene, MainMenuScene, and TrainPreviewScene
- `train/`: Individual mesh procedural train prototypes
- `ui/`: Vanilla DOM UI menus and settings
- `audio/`: Earlier Web Audio synthesis experiments
- `styles/`: Vanilla CSS stylesheets (loading, main, menu)
- `main.js`: Milestone 01 entry point

### Active Architecture
The active production system is located under `/src/game/` and `/src/railway/`:
- Entry point: `index.html` -> `/src/main.tsx` -> `/src/App.tsx` -> `<GameApp />` (`/src/game/ui/GameApp.tsx`)
- TypeScript + React 19 + Three.js + Zustand
- InstancedMesh high-performance train construction (`/src/game/train/TrainBuilder.ts`)
- Broad gauge track and network geometry (`/src/railway/`)
