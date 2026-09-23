import * as THREE from 'three';
import { latLonDepthToScene } from './coordinates.js';
import { eventBus } from './eventBus.js';

/**
 * Instrument marker types with distinct geometry/color.
 * Person 2 uses these constants when adding markers.
 */
const MARKER_TYPES = {
  argo:   { color: 0xff6b35, emissive: 0xff4500, geometry: 'sphere',   label: 'Argo Float' },
  glider: { color: 0x00c9a7, emissive: 0x00a88a, geometry: 'cone',     label: 'Glider' },
  ctd:    { color: 0x6c8cff, emissive: 0x4466dd, geometry: 'cylinder', label: 'CTD Cast' },
  buoy:   { color: 0xffd93d, emissive: 0xccb030, geometry: 'diamond',  label: 'Moored Buoy' },
};

function createMarkerGeometry(type) {
  switch (type) {
    case 'cone':
      return new THREE.ConeGeometry(1.5, 3.5, 8);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
    case 'diamond': {
      // Octahedron looks like a diamond
      return new THREE.OctahedronGeometry(2.0);
    }
    case 'sphere':
    default:
      return new THREE.SphereGeometry(1.8, 16, 16);
  }
}

export class MarkerManager {
  constructor(oceanScene, grid) {
    this.oceanScene = oceanScene;
    this.grid = grid;
    this.markers = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this._currentOceanData = null;

    // Tooltip overlay
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'ctrl-panel';
    this.tooltip.style.cssText = `
      display: none; position: absolute;
      padding: 8px 12px; font-size: 11px;
      pointer-events: none; z-index: 200;
    `;
    oceanScene.container.appendChild(this.tooltip);

    oceanScene.container.addEventListener('click', (e) => this.onMouseClick(e));
    oceanScene.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  /**
   * Set the current ocean data (needed for vertical profile extraction).
   * Called from main.js whenever data changes.
   */
  setOceanData(oceanData) {
    this._currentOceanData = oceanData;
  }

  /**
   * Add a marker at the given lat/lon/depth with a specific instrument type.
   *
   * @param {number} lat
   * @param {number} lon
   * @param {number} depth
   * @param {object} [options]
   * @param {string} [options.type='argo'] — 'argo'|'glider'|'ctd'|'buoy'
   * @param {string} [options.id] — optional unique ID for this marker
   * @param {object} [options.metadata] — optional extra metadata Person 2 can attach
   */
  addMarker(lat, lon, depth, options = {}) {
    const type = options.type || 'argo';
    const config = MARKER_TYPES[type] || MARKER_TYPES.argo;

    const pos = latLonDepthToScene(lat, lon, depth, this.grid);
    const geometry = createMarkerGeometry(config.geometry);
    const material = new THREE.MeshPhongMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: 0.4,
      shininess: 80,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.userData = {
      lat, lon, depth,
      type,
      label: config.label,
      id: options.id || `${type}-${this.markers.length}`,
      metadata: options.metadata || {},
    };

    this.oceanScene.getScene().add(mesh);
    this.markers.push({ mesh, lat, lon, depth, type });

    console.log(`📍 ${config.label}: ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E, ${depth}m`);
    return mesh.userData.id;
  }

  /**
   * Extract a vertical profile (all depths) at the nearest grid column to lat/lon.
   * Returns depth-vs-variable arrays that Person 2 can plot.
   *
   * @param {number} lat
   * @param {number} lon
   * @param {object} [oceanData] — optional, uses current data if not provided
   * @returns {{ depths: number[], temperature: number[], salinity: number[], lat: number, lon: number }}
   */
  getVerticalProfile(lat, lon, oceanData) {
    const data = oceanData || this._currentOceanData;
    if (!data?.grid?.lat?.length) return null;

    const { grid, temperature, salinity } = data;

    // Find nearest grid indices
    const latIdx = _findNearest(grid.lat, lat);
    const lonIdx = _findNearest(grid.lon, lon);

    const profile = {
      lat: grid.lat[latIdx],
      lon: grid.lon[lonIdx],
      depths: [],
      temperature: [],
      salinity: [],
    };

    for (let d = 0; d < grid.depth.length; d++) {
      profile.depths.push(grid.depth[d]);
      profile.temperature.push(temperature?.[d]?.[latIdx]?.[lonIdx] ?? null);
      profile.salinity.push(salinity?.[d]?.[latIdx]?.[lonIdx] ?? null);
    }

    return profile;
  }

  onMouseClick(event) {
    const rect = this.oceanScene.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Use getCamera() for correct camera reference
    this.raycaster.setFromCamera(this.mouse, this.oceanScene.getCamera());
    const intersects = this.raycaster.intersectObjects(this.markers.map(m => m.mesh));

    if (intersects.length > 0) {
      const hitMarker = intersects[0].object;
      const { lat, lon, depth, type, label, id, metadata } = hitMarker.userData;

      console.log(`✅ ${label} clicked: ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E, ${depth}m`);

      // Emit marker clicked event
      eventBus.emit('markerClicked', { lat, lon, depth, type, id, metadata });

      // Extract and emit vertical profile for Person 2's charts
      const profile = this.getVerticalProfile(lat, lon);
      if (profile) {
        eventBus.emit('profileDataReady', { profile, markerId: id, markerType: type });
        console.log(`📊 Profile data emitted: ${profile.depths.length} depth levels`);
      }

      // Also dispatch as window event for backward compat
      window.dispatchEvent(new CustomEvent('markerClicked', {
        detail: { lat, lon, depth, type, id }
      }));

      // Flash effect
      const origColor = hitMarker.material.color.getHex();
      hitMarker.material.color.set(0xffff00);
      hitMarker.material.emissive.set(0xffff00);
      setTimeout(() => {
        hitMarker.material.color.set(origColor);
        const config = MARKER_TYPES[type] || MARKER_TYPES.argo;
        hitMarker.material.emissive.set(config.emissive);
      }, 300);
    }
  }

  onMouseMove(event) {
    const rect = this.oceanScene.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.oceanScene.getCamera());
    const intersects = this.raycaster.intersectObjects(this.markers.map(m => m.mesh));

    if (intersects.length > 0) {
      const { lat, lon, depth, label, metadata } = intersects[0].object.userData;
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = `${event.clientX - rect.left + 12}px`;
      this.tooltip.style.top = `${event.clientY - rect.top - 10}px`;
      
      let measurementsHtml = '';
      if (metadata && metadata.measurements) {
        const m = metadata.measurements;
        const speed = Math.sqrt((m.u_current || 0) ** 2 + (m.v_current || 0) ** 2);
        const direction = Math.atan2((m.v_current || 0), (m.u_current || 0)) * (180 / Math.PI);
        measurementsHtml = `
          <hr style="border-color: rgba(255,255,255,0.1); margin: 6px 0;" />
          <span style="color: #ff9b72;">Temp: ${m.temperature?.toFixed(2)} °C</span><br/>
          <span style="color: #7ccbff;">Salinity: ${m.salinity?.toFixed(3)} PSU</span><br/>
          <span style="color: #a0c4df;">Speed: ${speed.toFixed(3)} m/s</span><br/>
          <span style="color: #c4a0df;">Dir: ${direction.toFixed(1)}°</span>
        `;
      }

      this.tooltip.innerHTML = `
        <b style="color: #4db8ff;">${label}</b><br/>
        ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E<br/>
        Depth: ${depth}m
        ${measurementsHtml}
      `;
    } else {
      this.tooltip.style.display = 'none';
    }
  }

  /** Remove a marker by ID */
  removeMarker(id) {
    const idx = this.markers.findIndex(m => m.mesh.userData.id === id);
    if (idx === -1) return;
    const { mesh } = this.markers[idx];
    this.oceanScene.getScene().remove(mesh);
    mesh.geometry?.dispose();
    mesh.material?.dispose();
    this.markers.splice(idx, 1);
  }

  clear() {
    this.markers.forEach(({ mesh }) => {
      this.oceanScene.getScene().remove(mesh);
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    });
    this.markers = [];
  }

  /** Get list of available marker types for Person 2's UI */
  static getMarkerTypes() {
    return { ...MARKER_TYPES };
  }
}

/* ── utility ── */
function _findNearest(arr, value) {
  let minDist = Infinity;
  let best = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - value);
    if (d < minDist) { minDist = d; best = i; }
  }
  return best;
}