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

## Day 2 Status ✅

- [x] Raycasting (marker clicking)
- [x] Colorbar legend
- [x] Event bus (Person 3 integration)

## Testing

1. Open http://localhost:5173
2. Click orange markers → turn yellow
3. Console logs `markerClicked` event
4. Depth slider updates volume in real-time

## Integration Checklist

- [ ] Person 5: Provide GET /data endpoint
- [ ] Person 3: Emit depthChanged → eventBus
- [ ] Person 2: Listen for markerClicked events

## Files

- src/ scene.js renderer.js coordinates.js mockData.js depthSlider.js raycasting.js ← NEW colorbar.js ← NEW eventBus.js ← NEW main.js