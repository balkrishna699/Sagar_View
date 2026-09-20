import * as THREE from 'three';
import { OceanScene, startRenderLoop } from './scene.js';
import { generateMockOceanData } from './mockData.js';
import { renderOceanVolume } from './renderer.js';
import { DepthSlider } from './depthSlider.js';

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