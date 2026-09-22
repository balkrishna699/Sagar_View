/**
 * Person 2 — Instrument Observation Records
 *
 * Adapted from Person 2's `person2-instruments` branch.
 * Provides test instrument data for the 3D ocean viewer.
 *
 * IMPORTANT: These are TEMPORARY test instruments.
 * They will be replaced by real instrument records
 * from the project dataset / Person 5's API.
 *
 * Integration with Person 1:
 *   - MarkerManager.addMarker() uses these records
 *   - Each record maps to a typed 3D marker (argo/glider/ctd/buoy)
 *   - Measurements are displayed on marker click + profile charts
 */

export const instrumentData = [
  {
    id: 'ARGO-001',
    type: 'argo',
    label: 'Argo Float',
    latitude: 15.2,
    longitude: 75.1,
    depth: 200,
    status: 'Active',
    measurements: {
      temperature: 22.371,
      salinity: 34.647,
      u_current: 0.0899,
      v_current: -0.1168,
    },
  },
  {
    id: 'ARGO-002',
    type: 'argo',
    label: 'Argo Float',
    latitude: 15.6,
    longitude: 75.5,
    depth: 150,
    status: 'Active',
    measurements: {
      temperature: 24.15,
      salinity: 34.72,
      u_current: 0.12,
      v_current: -0.08,
    },
  },
  {
    id: 'GLIDER-001',
    type: 'glider',
    label: 'Glider',
    latitude: 15.4,
    longitude: 75.7,
    depth: 80,
    status: 'Active',
    measurements: {
      temperature: 26.42,
      salinity: 34.59,
      u_current: 0.15,
      v_current: -0.05,
    },
  },
  {
    id: 'CTD-001',
    type: 'ctd',
    label: 'CTD Cast',
    latitude: 15.8,
    longitude: 75.3,
    depth: 300,
    status: 'Completed',
    measurements: {
      temperature: 18.92,
      salinity: 34.81,
      u_current: 0.06,
      v_current: -0.14,
    },
  },
  {
    id: 'BUOY-001',
    type: 'buoy',
    label: 'Moored Buoy',
    latitude: 15.3,
    longitude: 75.6,
    depth: 50,
    status: 'Active',
    measurements: {
      temperature: 27.83,
      salinity: 34.52,
      u_current: 0.08,
      v_current: -0.03,
    },
  },
];

/**
 * Get all instrument records.
 * @returns {Array}
 */
export function getAllInstruments() {
  return instrumentData;
}

/**
 * Find an instrument by ID.
 * @param {string} id
 * @returns {object|null}
 */
export function getInstrumentById(id) {
  return instrumentData.find(inst => inst.id === id) ?? null;
}

/**
 * Get instruments filtered by type.
 * @param {string} type — 'argo'|'glider'|'ctd'|'buoy'
 * @returns {Array}
 */
export function getInstrumentsByType(type) {
  return instrumentData.filter(inst => inst.type === type);
}
