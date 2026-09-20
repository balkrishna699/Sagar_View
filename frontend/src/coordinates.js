import * as THREE from 'three';

/**
 * Transform oceanographic coordinates to 3D scene space
 * Assumes lat/lon/depth from model.py grid object
 * 
 * @param {number} lat
 * @param {number} lon
 * @param {number} depth - meters
 * @param {object} grid - { lat: [], lon: [], depth: [] }
 * @returns {THREE.Vector3}
 */
export function latLonDepthToScene(lat, lon, depth, grid) {
  if (!grid?.lat?.length || !grid?.lon?.length || !grid?.depth?.length) {
    throw new Error('Invalid grid object from API');
  }
  
  const minLat = Math.min(...grid.lat);
  const maxLat = Math.max(...grid.lat);
  const minLon = Math.min(...grid.lon);
  const maxLon = Math.max(...grid.lon);
  const maxDepth = Math.max(...grid.depth);
  
  // Normalize to [0, 100]
  const x = ((lat - minLat) / (maxLat - minLat)) * 100;
  const y = ((lon - minLon) / (maxLon - minLon)) * 100;
  
  // Depth: surface (0m) = z:50, bottom (maxDepth) = z:0
  const z = (1 - (depth / maxDepth)) * 50;
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Reverse transform
 */
export function sceneToLatLonDepth(pos, grid) {
  const minLat = Math.min(...grid.lat);
  const maxLat = Math.max(...grid.lat);
  const minLon = Math.min(...grid.lon);
  const maxLon = Math.max(...grid.lon);
  const maxDepth = Math.max(...grid.depth);
  
  return {
    lat: minLat + (pos.x / 100) * (maxLat - minLat),
    lon: minLon + (pos.y / 100) * (maxLon - minLon),
    depth: (1 - (pos.z / 50)) * maxDepth
  };
}