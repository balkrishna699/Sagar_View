# Person 1: 3D Ocean Renderer

## Quick Start

```bash
npm install
npm run dev
```

## Status: Day 1 ✅

- [x] Vite + Three.js setup
- [x] Scene initialization (camera, renderer, lighting)
- [x] Coordinate transforms (lat/lon/depth ↔ 3D)
- [x] Mock data generator
- [x] Volume rendering (points-based)
- [x] Depth slider control

## Architecture
- src/ scene.js 
- Three.js scene setup renderer.js 
- Volume rendering coordinates.js 
- Coordinate transforms mockData.js 
- Fake ocean data depthSlider.js 
- Depth control UI main.js 
- Entry point