import * as THREE from 'three';
import { OceanScene, startRenderLoop } from './scene.js';
import { generateMockOceanData } from './mockData.js';
import { renderOceanVolume } from './renderer.js';
import { DepthSlider } from './depthSlider.js';
import { MarkerManager } from './raycasting.js';
import { Colorbar } from './colorbar.js';
import { eventBus } from './eventBus.js';

const container = document.getElementById('canvas-container');
const oceanScene = new OceanScene(container);

// Load mock data
const mockData = generateMockOceanData();
console.log('Mock data:', mockData);

// Render initial volume
renderOceanVolume(oceanScene, mockData, 0);

// Depth slider
new DepthSlider(container, mockData.grid.depth.length - 1, (depthIndex) => {
  renderOceanVolume(oceanScene, mockData, depthIndex);
});

startRenderLoop(oceanScene);

// Expose for debugging
window.oceanScene = oceanScene;
window.mockData = mockData;
window.renderOceanVolume = renderOceanVolume;

const markerManager = new MarkerManager(oceanScene, mockData.grid);
markerManager.addMarker(15.25, 75.25, 100);
markerManager.addMarker(15.50, 75.50, 50);
markerManager.addMarker(15.75, 75.75, 200);

window.markerManager = markerManager;

const colorbar = new Colorbar(container);
colorbar.update(mockData.minTemp, mockData.maxTemp);

window.colorbar = colorbar;

eventBus.on('depthChanged', ({ depthIndex }) => {
  renderOceanVolume(oceanScene, mockData, depthIndex);
});

window.eventBus = eventBus;