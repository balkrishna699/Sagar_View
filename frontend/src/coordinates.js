import * as THREE from 'three';

/**
 * Configurable vertical exaggeration factor.
 * Real ocean depth range (~500 m) is tiny vs. horizontal extent (~100 km).
 * Exaggeration > 1 stretches the z-axis so depth structure is visible.
 */
let verticalExaggeration = 1.0;

export function setVerticalExaggeration(factor) {
  verticalExaggeration = Math.max(0.1, factor);
}

export function getVerticalExaggeration() {
  return verticalExaggeration;
}

/* ── Cached grid extents (avoids re-spreading inside tight loops) ── */
let _cachedGrid = null;
let _extents = null;

function getExtents(grid) {
  // Return cached result if grid reference hasn't changed
  if (grid === _cachedGrid && _extents) return _extents;

  const minLat  = Math.min(...grid.lat);
  const maxLat  = Math.max(...grid.lat);
  const minLon  = Math.min(...grid.lon);
  const maxLon  = Math.max(...grid.lon);
  const maxDepth = Math.max(...grid.depth);

  _cachedGrid = grid;
  _extents = { minLat, maxLat, minLon, maxLon, maxDepth };
  return _extents;
}

/**
 * Transform oceanographic coordinates to 3D scene space
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} depth - meters (0 = surface)
 * @param {object} grid - { lat: [], lon: [], depth: [] }
 * @returns {THREE.Vector3}
 */
export function latLonDepthToScene(lat, lon, depth, grid) {
  if (!grid?.lat?.length || !grid?.lon?.length || !grid?.depth?.length) {
    throw new Error('Invalid grid object from API');
  }

  const { minLat, maxLat, minLon, maxLon, maxDepth } = getExtents(grid);

  // Normalize lat/lon to [0, 100]
  const x = maxLat === minLat ? 50 : ((lat - minLat) / (maxLat - minLat)) * 100;
  const y = maxLon === minLon ? 50 : ((lon - minLon) / (maxLon - minLon)) * 100;

  // Depth: surface (0 m) → z = 50 * exaggeration, bottom → z = 0
  const zRange = 50 * verticalExaggeration;
  const z = maxDepth === 0 ? zRange : (1 - depth / maxDepth) * zRange;

  return new THREE.Vector3(x, y, z);
}

/**
 * Reverse transform: scene position → lat/lon/depth
 */
export function sceneToLatLonDepth(pos, grid) {
  const { minLat, maxLat, minLon, maxLon, maxDepth } = getExtents(grid);

  const zRange = 50 * verticalExaggeration;

  return {
    lat:   minLat + (pos.x / 100) * (maxLat - minLat),
    lon:   minLon + (pos.y / 100) * (maxLon - minLon),
    depth: (1 - pos.z / zRange) * maxDepth
  };
}