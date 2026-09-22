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
import { getState, setState, updateCameraPosition, getAvailableOptions } from './sceneState.js';
import { DEFAULT_COLORMAP } from './colormaps.js';

// ── Loading helpers ──────────────────────────────────────
const loadingOverlay = document.getElementById('loading-overlay');
const loadingStatus  = document.getElementById('loading-status');
const toast          = document.getElementById('toast');

function setLoadingStatus(text) {
  if (loadingStatus) loadingStatus.textContent = text;
}

function hideLoading() {
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
  // Remove from DOM after transition
  setTimeout(() => {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
  }, 600);
}

function showToast(message, durationMs = 4000) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), durationMs);
}

// ── Bootstrap ──────────────────────────────────────────
setLoadingStatus('Creating 3D scene…');
const container = document.getElementById('canvas-container');
const oceanScene = new OceanScene(container);

// ── Data: try real API first, fall back to mock ────────
setLoadingStatus('Fetching ocean data…');
let oceanData;
try {
  const apiData = await fetchOceanData();
  if (apiData && apiData.grid && apiData.temperature) {
    oceanData = apiData;
    setState({ dataSource: 'api' });
    console.log('✅ Using real API data');
  }
} catch (_) { /* fall through to mock */ }

if (!oceanData) {
  setLoadingStatus('Using demo data…');
  oceanData = generateMockOceanData();
  setState({ dataSource: 'mock' });
  console.log('ℹ️ Using mock data (backend unavailable)');
}

// ── Time Series ────────────────────────────────────────
setLoadingStatus('Building time series…');
const timeSeriesManager = new TimeSeriesManager(oceanData);
let currentData = timeSeriesManager.getCurrentData();
console.log(`⏱️ Time series loaded: ${timeSeriesManager.timesteps.length} steps`);

// ── Initial render (single call) ──────────────────────
setLoadingStatus('Rendering volume…');
renderOceanVolume(oceanScene, currentData, 0, DEFAULT_COLORMAP);

// ── UI Controls ────────────────────────────────────────
const colorbar = new Colorbar(container);
colorbar.update(currentData.minTemp, currentData.maxTemp);

const markerManager = new MarkerManager(oceanScene, currentData.grid);
markerManager.setOceanData(currentData);

// Demo markers with different instrument types
markerManager.addMarker(15.25, 75.25, 100, { type: 'argo',   id: 'argo-demo-1' });
markerManager.addMarker(15.50, 75.50, 50,  { type: 'glider', id: 'glider-demo-1' });
markerManager.addMarker(15.75, 75.75, 200, { type: 'ctd',    id: 'ctd-demo-1' });
markerManager.addMarker(15.40, 75.60, 150, { type: 'buoy',   id: 'buoy-demo-1' });

new DepthSlider(container, currentData.grid, (depthIndex) => {
  setState({ currentDepthIndex: depthIndex });
  const { currentVariable, currentColormap } = getState();
  renderOceanVolumeMultiVariable(oceanScene, currentData, depthIndex, currentVariable, currentColormap);
});

new TimeControls(container, timeSeriesManager);

// ── Event wiring ───────────────────────────────────────
eventBus.on('depthChanged', ({ depthIndex }) => {
  setState({ currentDepthIndex: depthIndex });
});

window.addEventListener('timeIndexChanged', (e) => {
  const { timeIndex, timestamp } = e.detail;
  currentData = timeSeriesManager.getDataAtIndex(timeIndex);
  setState({ currentTimeIndex: timeIndex });
  markerManager.setOceanData(currentData);

  const { currentVariable, currentColormap, currentDepthIndex } = getState();
  renderOceanVolumeMultiVariable(oceanScene, currentData, currentDepthIndex, currentVariable, currentColormap);

  const minVal = currentVariable === 'temperature' ? currentData.minTemp : currentData.minSal;
  const maxVal = currentVariable === 'temperature' ? currentData.maxTemp : currentData.maxSal;
  const unit = currentVariable === 'temperature' ? '°C' : 'PSU';
  colorbar.update(minVal, maxVal, unit);

  eventBus.emit('timeChanged', { timeIndex, timestamp });
});

// ── Dashboard bridge (pass colorbar for variable switching) ──
const bridge = setupDashboardBridge(oceanScene, currentData, renderOceanVolume, colorbar);

// ── Isosurfaces (non-blocking) ─────────────────────────
const isosurfaceRenderer = new IsosurfaceRenderer(oceanScene);
isosurfaceRenderer.loadIsosurfaces(0).catch(() => {});   // fire & forget

eventBus.on('timeChanged', async ({ timeIndex }) => {
  await isosurfaceRenderer.animateToTimeIndex(timeIndex);
});

// ── Render loop (with camera state sync) ───────────────
function enhancedRenderLoop() {
  requestAnimationFrame(enhancedRenderLoop);
  updateCameraPosition(oceanScene.getCamera());
  oceanScene.render();
}
enhancedRenderLoop();

// ── Hide loading overlay ───────────────────────────────
hideLoading();
if (getState().dataSource === 'mock') {
  showToast('⚡ Demo mode — backend not connected. Showing synthetic data.');
} else {
  showToast('✅ Connected to ocean data API');
}

// ── Dev globals ────────────────────────────────────────
window.oceanScene = oceanScene;
window.oceanData = currentData;
window.markerManager = markerManager;
window.colorbar = colorbar;
window.eventBus = eventBus;
window.fetchOceanData = fetchOceanData;
window.timeSeriesManager = timeSeriesManager;
window.renderOceanVolume = renderOceanVolume;
window.sceneState = { getState, setState, getAvailableOptions };

console.log('🌊 SAGAR Ocean Visualization initialized!');