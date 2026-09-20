import { OceanScene, startRenderLoop } from './scene.js';

const container = document.getElementById('canvas-container');
const oceanScene = new OceanScene(container);

// Test cube
const testGeometry = new THREE.BoxGeometry(20, 20, 20);
const testMaterial = new THREE.MeshPhongMaterial({ color: 0x2a78d6 });
const testMesh = new THREE.Mesh(testGeometry, testMaterial);
oceanScene.getScene().add(testMesh);

startRenderLoop(oceanScene);

console.log('✅ Scene initialized');
window.oceanScene = oceanScene;