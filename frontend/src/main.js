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
import { ProfileChart } from './profileChart.js';
import { getAllInstruments } from './instrumentData.js';
import { VariableSelector } from './variableselector.js';
import { CrossSectionTool } from './crossSection.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// ── Performance Metrics ──────────────────────────────────
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = 'auto';
stats.domElement.style.bottom = '20px';
stats.domElement.style.left = '20px';
stats.domElement.style.zIndex = '500';
stats.domElement.style.borderRadius = '8px';
stats.domElement.style.overflow = 'hidden';
stats.domElement.style.filter = 'invert(0.9) hue-rotate(180deg)';
stats.domElement.style.transform = 'scale(1.5)';
stats.domElement.style.transformOrigin = 'bottom left';
document.body.appendChild(stats.domElement);

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
const variableSelector = new VariableSelector(container);
const crossSectionTool = new CrossSectionTool(container);
const markerManager = new MarkerManager(oceanScene, currentData.grid);
markerManager.setOceanData(currentData);

// Person 2's instrument data — populate markers from instrument records
const instruments = getAllInstruments();
instruments.forEach(inst => {
  markerManager.addMarker(inst.latitude, inst.longitude, inst.depth, {
    type: inst.type,
    id: inst.id,
    metadata: { status: inst.status, measurements: inst.measurements },
  });
});
console.log(`📍 Loaded ${instruments.length} instrument markers (Person 2 data)`);

// Person 2's profile chart — opens on marker click
const profileChart = new ProfileChart(container);

new DepthSlider(container, currentData.grid, (depthIndex) => {
  setState({ currentDepthIndex: depthIndex });
  const { currentVariable, currentColormap } = getState();
  renderOceanVolumeMultiVariable(oceanScene, currentData, depthIndex, currentVariable, currentColormap);
});

// Link State Changes to Colorbar and Render updates
eventBus.on('colorbarChanged', ({ variable, colormap }) => {
  const minVal = variable === 'temperature' ? currentData.minTemp : variable === 'salinity' ? currentData.minSal : currentData.minSpeed;
  const maxVal = variable === 'temperature' ? currentData.maxTemp : variable === 'salinity' ? currentData.maxSal : currentData.maxSpeed;
  const unit = variable === 'temperature' ? 'Temperature (°C)' : variable === 'salinity' ? 'Salinity (PSU)' : 'Current Speed (m/s)';
  
  colorbar.setColormap(colormap);
  colorbar.update(minVal, maxVal, unit);
  
  const { currentDepthIndex } = getState();
  renderOceanVolumeMultiVariable(oceanScene, currentData, currentDepthIndex, variable, colormap);
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

  const minVal = currentVariable === 'temperature' ? currentData.minTemp : currentVariable === 'salinity' ? currentData.minSal : currentData.minSpeed;
  const maxVal = currentVariable === 'temperature' ? currentData.maxTemp : currentVariable === 'salinity' ? currentData.maxSal : currentData.maxSpeed;
  const unit = currentVariable === 'temperature' ? '°C' : currentVariable === 'salinity' ? 'PSU' : 'm/s';
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
  stats.update();
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
window.profileChart = profileChart;

console.log('🌊 SAGAR Ocean Visualization initialized!');