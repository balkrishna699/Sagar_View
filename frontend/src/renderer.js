import * as THREE from 'three';
import { latLonDepthToScene, getVerticalExaggeration } from './coordinates.js';
import { getColor, DEFAULT_COLORMAP } from './colormaps.js';

// Global clipping planes (normals face INWARD towards the visible region)
export const clipPlaneX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);
export const clipPlaneY = new THREE.Plane(new THREE.Vector3(0, -1, 0), 50);
export const clipPlaneZ = new THREE.Plane(new THREE.Vector3(0, 0, -1), 100);

export function updateClippingPlanes(pctX, pctY, pctZ) {
  clipPlaneX.constant = (pctX / 100) * 100;
  clipPlaneZ.constant = (pctZ / 100) * 100;
  const yRange = 50 * getVerticalExaggeration();
  clipPlaneY.constant = (pctY / 100) * yRange;
}

/* ── helpers ── */
function clearNamed(scene, name) {
  let obj;
  while ((obj = scene.getObjectByName(name))) {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    if (obj.isInstancedMesh) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  }
}

/**
 * Render ocean volume as instanced semi-transparent voxel cubes.
 * Falls back to point cloud if the grid is very large (>50k cells).
 *
 * @param {OceanScene} oceanScene
 * @param {object}     oceanData  – { grid, temperature, minTemp, maxTemp, ... }
 * @param {number}     depthSliceIndex – 0 = surface only, max = show all depths
 * @param {string}     colormapName – colormap to use (default: ocean)
 */
export function renderOceanVolume(oceanScene, oceanData, depthSliceIndex = 0, colormapName = DEFAULT_COLORMAP) {
  const scene = oceanScene.getScene();
  clearNamed(scene, 'oceanVolume');

  const { grid, temperature, minTemp, maxTemp } = oceanData;
  const nDepth = grid.depth.length;
  const nLat   = grid.lat.length;
  const nLon   = grid.lon.length;
  const maxD   = Math.min(depthSliceIndex, nDepth - 1);

  const totalCells = (maxD + 1) * nLat * nLon;

  // For very large grids fall back to lightweight points
  if (totalCells > 50000) {
    return _renderPoints(scene, grid, temperature, minTemp, maxTemp, maxD, nLat, nLon, colormapName);
  }

  // ── Instanced voxel cubes ──
  // Compute voxel size from grid spacing
  const p0 = latLonDepthToScene(grid.lat[0], grid.lon[0], 0, grid);
  const p1 = latLonDepthToScene(
    grid.lat[Math.min(1, nLat - 1)],
    grid.lon[Math.min(1, nLon - 1)],
    grid.depth[Math.min(1, nDepth - 1)],
    grid
  );
  const dx = nLat > 1 ? Math.abs(p1.x - p0.x) : 5;
  const dy = nLon > 1 ? Math.abs(p1.y - p0.y) : 5;
  const dz = nDepth > 1 ? Math.abs(p1.z - p0.z) : 5;

  const boxGeo = new THREE.BoxGeometry(dx * 0.94, dy * 0.94, dz * 0.94);
  const boxMat = new THREE.MeshStandardMaterial({
    vertexColors: false,
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    metalness: 0.5,
    side: THREE.FrontSide,
    depthWrite: false, // Prevents self-occlusion artifacts
  });

  const mesh = new THREE.InstancedMesh(boxGeo, boxMat, totalCells);
  mesh.name = 'oceanVolume';

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let idx = 0;

  for (let d = maxD; d >= 0; d--) {
    for (let la = 0; la < nLat; la++) {
      for (let lo = 0; lo < nLon; lo++) {
        const pos = latLonDepthToScene(grid.lat[la], grid.lon[lo], grid.depth[d], grid);
        dummy.position.copy(pos);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        const temp = temperature[d][la][lo];
        color.copy(getColor(temp, minTemp, maxTemp, colormapName));
        mesh.setColorAt(idx, color);
        idx++;
      }
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate  = true;
  scene.add(mesh);

  console.log(`✅ Rendered ${totalCells} voxels (depth 0–${maxD}, colormap: ${colormapName})`);
}

/* ── Lightweight fallback for big grids ── */
function _renderPoints(scene, grid, temperature, minTemp, maxTemp, maxD, nLat, nLon, colormapName) {
  const positions = [];
  const colors    = [];

  for (let d = 0; d <= maxD; d++) {
    for (let la = 0; la < nLat; la++) {
      for (let lo = 0; lo < nLon; lo++) {
        const pos = latLonDepthToScene(grid.lat[la], grid.lon[lo], grid.depth[d], grid);
        positions.push(pos.x, pos.y, pos.z);
        const c = getColor(temperature[d][la][lo], minTemp, maxTemp, colormapName);
        colors.push(c.r, c.g, c.b);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(colors), 3));

  const mat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'oceanVolume';
  scene.add(pts);

  console.log(`✅ Rendered ${positions.length / 3} points (fallback, depth 0–${maxD})`);
}

/**
 * Multi-variable render (temperature / salinity / etc.)
 *
 * @param {OceanScene} oceanScene
 * @param {object}     oceanData
 * @param {number}     depthSliceIndex
 * @param {string}     variable – key in oceanData (e.g. 'temperature', 'salinity')
 * @param {string}     colormapName
 */
export function renderOceanVolumeMultiVariable(
  oceanScene,
  oceanData,
  depthSliceIndex = 0,
  variable = 'temperature',
  colormapName = DEFAULT_COLORMAP
) {
  const scene = oceanScene.getScene();
  clearNamed(scene, 'oceanVolume');

  const { grid } = oceanData;
  const data   = oceanData[variable];
  const minVal = variable === 'temperature' ? oceanData.minTemp : variable === 'salinity' ? oceanData.minSal : oceanData.minSpeed;
  const maxVal = variable === 'temperature' ? oceanData.maxTemp : variable === 'salinity' ? oceanData.maxSal : oceanData.maxSpeed;

  if (!data) {
    console.warn(`⚠️ Variable "${variable}" not found in ocean data`);
    return { minVal: 0, maxVal: 0 };
  }

  const nDepth = grid.depth.length;
  const nLat   = grid.lat.length;
  const nLon   = grid.lon.length;
  const maxD   = Math.min(depthSliceIndex, nDepth - 1);
  const totalCells = (maxD + 1) * nLat * nLon;

  // ── Instanced cubes (same approach) ──
  const p0 = latLonDepthToScene(grid.lat[0], grid.lon[0], 0, grid);
  const p1 = latLonDepthToScene(
    grid.lat[Math.min(1, nLat - 1)],
    grid.lon[Math.min(1, nLon - 1)],
    grid.depth[Math.min(1, nDepth - 1)],
    grid
  );
  const dx = nLat > 1 ? Math.abs(p1.x - p0.x) : 5;
  const dy = nLon > 1 ? Math.abs(p1.y - p0.y) : 5;
  const dz = nDepth > 1 ? Math.abs(p1.z - p0.z) : 5;

  // Reverted back to 0.94 per user feedback
  const boxGeo = new THREE.BoxGeometry(dx * 0.94, dy * 0.94, dz * 0.94);
  const boxMat = new THREE.MeshStandardMaterial({
    vertexColors: false,
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    metalness: 0.5,
    side: THREE.FrontSide,
    depthWrite: false, // Prevents self-occlusion artifacts
    clippingPlanes: [clipPlaneX, clipPlaneY, clipPlaneZ],
    clipIntersection: false,
  });

  const mesh = new THREE.InstancedMesh(boxGeo, boxMat, totalCells);
  mesh.name = 'oceanVolume';

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let idx = 0;

  for (let d = maxD; d >= 0; d--) {
    for (let la = 0; la < nLat; la++) {
      for (let lo = 0; lo < nLon; lo++) {
        const pos = latLonDepthToScene(grid.lat[la], grid.lon[lo], grid.depth[d], grid);
        dummy.position.copy(pos);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        color.copy(getColor(data[d][la][lo], minVal, maxVal, colormapName));
        mesh.setColorAt(idx, color);
        idx++;
      }
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate  = true;
  scene.add(mesh);

  console.log(`✅ Rendered ${variable} (${totalCells} voxels, colormap: ${colormapName})`);
  return { minVal, maxVal };
}

export default { renderOceanVolume, renderOceanVolumeMultiVariable };