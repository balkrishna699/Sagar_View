import * as THREE from 'three';
import { latLonDepthToScene } from './coordinates.js';

/**
 * Render ocean volume as colored point cloud
 * @param {OceanScene} oceanScene
 * @param {object} oceanData - from API/mockData
 * @param {number} depthSliceIndex - 0 = surface, max = bottom
 */
export function renderOceanVolume(oceanScene, oceanData, depthSliceIndex = 0) {
  const scene = oceanScene.getScene();
  
  // Remove old volume
  const oldVolume = scene.getObjectByName('oceanVolume');
  if (oldVolume) {
    scene.remove(oldVolume);
    oldVolume.geometry?.dispose();
    oldVolume.material?.dispose();
  }
  
  const { grid, temperature, minTemp, maxTemp } = oceanData;
  const [nDepth, nLat, nLon] = [grid.depth.length, grid.lat.length, grid.lon.length];
  
  const positions = [];
  const colors = [];
  
  // Colormap: blue (cold) → red (warm)
  const colormap = (value, min, max) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const hue = 0.66 * (1 - normalized); // 0.66=blue, 0=red
    return new THREE.Color().setHSL(hue, 1, 0.5);
  };
  
  // Render slices from surface to depthSliceIndex
  for (let d = 0; d <= Math.min(depthSliceIndex, nDepth - 1); d++) {
    for (let la = 0; la < nLat; la++) {
      for (let lo = 0; lo < nLon; lo++) {
        const pos = latLonDepthToScene(
          grid.lat[la],
          grid.lon[lo],
          grid.depth[d],
          grid
        );
        
        positions.push(pos.x, pos.y, pos.z);
        
        const temp = temperature[d][la][lo];
        const color = colormap(temp, minTemp, maxTemp);
        colors.push(color.r, color.g, color.b);
      }
    }
  }
  
  // Create geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  
  // Points material
  const material = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    sizeAttenuation: true
  });
  
  const volume = new THREE.Points(geometry, material);
  volume.name = 'oceanVolume';
  scene.add(volume);
  
  console.log(`✅ Rendered ${positions.length / 3} points (depth 0–${depthSliceIndex})`);
}

export default { renderOceanVolume };

/**
 * Render with support for multiple variables (temperature, salinity, etc.)
 */
export function renderOceanVolumeMultiVariable(
  oceanScene, 
  oceanData, 
  depthSliceIndex = 0,
  variable = 'temperature'  // 'temperature' or 'salinity'
) {
  const scene = oceanScene.getScene();
  
  const oldVolume = scene.getObjectByName('oceanVolume');
  if (oldVolume) {
    scene.remove(oldVolume);
    oldVolume.geometry?.dispose();
    oldVolume.material?.dispose();
  }
  
  const { grid } = oceanData;
  const data = oceanData[variable];  // Get temp or salinity
  const minVal = variable === 'temperature' ? oceanData.minTemp : oceanData.minSal;
  const maxVal = variable === 'temperature' ? oceanData.maxTemp : oceanData.maxSal;
  
  const [nDepth, nLat, nLon] = [grid.depth.length, grid.lat.length, grid.lon.length];
  
  const positions = [];
  const colors = [];
  
  const colormap = (value, min, max) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const hue = 0.66 * (1 - normalized);
    return new THREE.Color().setHSL(hue, 1, 0.5);
  };
  
  for (let d = 0; d <= Math.min(depthSliceIndex, nDepth - 1); d++) {
    for (let la = 0; la < nLat; la++) {
      for (let lo = 0; lo < nLon; lo++) {
        const pos = latLonDepthToScene(
          grid.lat[la],
          grid.lon[lo],
          grid.depth[d],
          grid
        );
        
        positions.push(pos.x, pos.y, pos.z);
        
        const value = data[d][la][lo];
        const color = colormap(value, minVal, maxVal);
        colors.push(color.r, color.g, color.b);
      }
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  
 const material = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  vertexColors: true,
  shininess: 100,
  emissive: 0x333333,
  side: THREE.DoubleSide
});
  
  const volume = new THREE.Points(geometry, material);
  volume.name = 'oceanVolume';
  scene.add(volume);
  
  console.log(`✅ Rendered ${variable} (${positions.length / 3} points)`);
  
  return { minVal, maxVal };  // Return for colorbar update
}