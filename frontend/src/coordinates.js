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

  // Map Lon to X (East/West) and Lat to Z (North/South)
  const x = maxLon === minLon ? 50 : ((lon - minLon) / (maxLon - minLon)) * 100;
  const z = maxLat === minLat ? 50 : ((lat - minLat) / (maxLat - minLat)) * 100;

  // Depth: surface (0 m) -> y = 50 * exaggeration, bottom -> y = 0
  const yRange = 50 * verticalExaggeration;
  const y = maxDepth === 0 ? yRange : (1 - depth / maxDepth) * yRange;

  return new THREE.Vector3(x, y, z);
}

/**
 * Reverse transform: scene position → lat/lon/depth
 */
export function sceneToLatLonDepth(pos, grid) {
  const { minLat, maxLat, minLon, maxLon, maxDepth } = getExtents(grid);

  const yRange = 50 * verticalExaggeration;

  return {
    lon:   minLon + (pos.x / 100) * (maxLon - minLon),
    lat:   minLat + (pos.z / 100) * (maxLat - minLat),
    depth: (1 - pos.y / yRange) * maxDepth
  };
}