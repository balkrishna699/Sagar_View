import * as THREE from 'three';
import { OceanScene, startRenderLoop } from './scene.js';
import { generateMockOceanData } from './mockData.js';
import { renderOceanVolume, renderOceanVolumeMultiVariable } from './renderer.js';
import { DepthSlider } from './depthSlider.js';
import { MarkerManager } from './raycasting.js';
import { Colorbar } from './colorbar.js';
import { eventBus } from './eventBus.js';
import { fetchOceanData } from './api.js';
import { setupDashboardBridge } from './dashboardBridge.js';
import { IsosurfaceRenderer } from './isosurfaceRenderer.js';
import { TimeSeriesManager } from './timeseries.js';
import { TimeControls } from './timeControls.js';

// ── Bootstrap ──────────────────────────────────────────
const container = document.getElementById('canvas-container');
const oceanScene = new OceanScene(container);

// ── Data: try real API first, fall back to mock ────────
let oceanData;
try {
  const apiData = await fetchOceanData();
  if (apiData && apiData.grid && apiData.temperature) {
    oceanData = apiData;
    console.log('✅ Using real API data');
  }
} catch (_) { /* fall through to mock */ }

if (!oceanData) {
  oceanData = generateMockOceanData();
  console.log('ℹ️ Using mock data (backend unavailable)');
}

// ── Time Series ────────────────────────────────────────
const timeSeriesManager = new TimeSeriesManager(oceanData);
let currentData = timeSeriesManager.getCurrentData();
console.log(`⏱️ Time series loaded: ${timeSeriesManager.timesteps.length} steps`);

// ── Initial render (single call) ──────────────────────
renderOceanVolume(oceanScene, currentData, 0);

// ── UI Controls ────────────────────────────────────────
const colorbar = new Colorbar(container);
colorbar.update(currentData.minTemp, currentData.maxTemp);

const markerManager = new MarkerManager(oceanScene, currentData.grid);
markerManager.addMarker(15.25, 75.25, 100);
markerManager.addMarker(15.50, 75.50, 50);
markerManager.addMarker(15.75, 75.75, 200);

new DepthSlider(container, currentData.grid, (depthIndex) => {
  renderOceanVolume(oceanScene, currentData, depthIndex);
});

new TimeControls(container, timeSeriesManager);

// ── Event wiring ───────────────────────────────────────
eventBus.on('depthChanged', ({ depthIndex }) => {
  renderOceanVolume(oceanScene, currentData, depthIndex);
});

window.addEventListener('timeIndexChanged', (e) => {
  const { timeIndex, timestamp } = e.detail;
  currentData = timeSeriesManager.getDataAtIndex(timeIndex);
  renderOceanVolume(oceanScene, currentData, 0);
  colorbar.update(currentData.minTemp, currentData.maxTemp);
  eventBus.emit('timeChanged', { timeIndex, timestamp });
});

// ── Dashboard bridge ───────────────────────────────────
setupDashboardBridge(oceanScene, currentData, renderOceanVolume);

// ── Isosurfaces (non-blocking) ─────────────────────────
const isosurfaceRenderer = new IsosurfaceRenderer(oceanScene);
isosurfaceRenderer.loadIsosurfaces(0).catch(() => {});   // fire & forget

eventBus.on('timeChanged', async ({ timeIndex }) => {
  await isosurfaceRenderer.animateToTimeIndex(timeIndex);
});

// ── Render loop ────────────────────────────────────────
startRenderLoop(oceanScene);

// ── Dev globals ────────────────────────────────────────
window.oceanScene = oceanScene;
window.oceanData = currentData;
window.markerManager = markerManager;
window.colorbar = colorbar;
window.eventBus = eventBus;
window.fetchOceanData = fetchOceanData;
window.timeSeriesManager = timeSeriesManager;
window.renderOceanVolume = renderOceanVolume;

console.log('🌊 SAGAR Ocean Visualization initialized!');