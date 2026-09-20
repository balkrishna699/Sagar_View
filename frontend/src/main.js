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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TimeSeriesManager } from './timeseries.js';
import { TimeControls } from './timeControls.js';

const container = document.getElementById('canvas-container');
const oceanScene = new OceanScene(container);

let mockData = generateMockOceanData();
console.log('Mock data:', mockData);

renderOceanVolume(oceanScene, mockData, 0);

const markerManager = new MarkerManager(oceanScene, mockData.grid);
markerManager.addMarker(15.25, 75.25, 100);
markerManager.addMarker(15.50, 75.50, 50);
markerManager.addMarker(15.75, 75.75, 200);

const colorbar = new Colorbar(container);
colorbar.update(mockData.minTemp, mockData.maxTemp);

new DepthSlider(container, mockData.grid.depth.length - 1, (depthIndex) => {
  renderOceanVolume(oceanScene, mockData, depthIndex);
});

eventBus.on('depthChanged', ({ depthIndex }) => {
  renderOceanVolume(oceanScene, mockData, depthIndex);
});

startRenderLoop(oceanScene);

window.oceanScene = oceanScene;
window.mockData = mockData;
window.renderOceanVolume = renderOceanVolume;
window.markerManager = markerManager;
window.colorbar = colorbar;
window.eventBus = eventBus;
window.fetchOceanData = fetchOceanData;

console.log('🌊 SAGAR Ocean Visualization initialized!');
console.log('Available globals: oceanScene, mockData, markerManager, colorbar, eventBus');

setupDashboardBridge(oceanScene, mockData, renderOceanVolume);

console.log('Dashboard bridge initialized');

// Initialize time series
const timeSeriesManager = new TimeSeriesManager(mockData);
let currentData = timeSeriesManager.getCurrentData();

console.log(`⏱️ Time series loaded: ${timeSeriesManager.timesteps.length} steps`);

// Render initial data
renderOceanVolume(oceanScene, currentData, 0);
colorbar.update(currentData.minTemp, currentData.maxTemp);

// Listen for time navigation
window.addEventListener('timeIndexChanged', (e) => {
  const { timeIndex, timestamp } = e.detail;
  currentData = timeSeriesManager.getDataAtIndex(timeIndex);
  console.log(`⏱️ Time: ${timestamp}`);
  
  // Re-render with new time data
  renderOceanVolume(oceanScene, currentData, 0);
  eventBus.emit('timeChanged', { timeIndex, timestamp });
});

// Expose for testing
window.timeSeriesManager = timeSeriesManager;

const isosurfaceRenderer = new IsosurfaceRenderer(oceanScene);

// Load initial isosurfaces (if files exist)
await isosurfaceRenderer.loadIsosurfaces(0);

// Animate when time changes
eventBus.on('timeChanged', async ({ timeIndex }) => {
  await isosurfaceRenderer.animateToTimeIndex(timeIndex);
});

new TimeControls(container, timeSeriesManager);