/*
 * Person 2 — Instrument Data
 *
 * This file defines the common structure used by
 * observation instruments in the 3D ocean viewer.
 *
 * IMPORTANT:
 * These are TEMPORARY test instruments.
 *
 * We are building the visualization/interaction system
 * independently first.
 *
 * Later these records will be replaced by the actual
 * instrument records supplied by the project dataset.
 */

export const instrumentData = [
  {
    id: "ARGO-001",

    type: "Argo Float",

    latitude: 15.2,
    longitude: 72.1,

    depth: 1050,

    status: "Active",

    measurements: {
      temperature: 22.371,
      salinity: 34.647,

      u_current: 0.0899,
      v_current: -0.1168
    }
  },

  {
    id: "ARGO-002",

    type: "Argo Float",

    latitude: 18.0,
    longitude: 75.0,

    depth: 750,

    status: "Active",

    measurements: {
      temperature: 24.15,
      salinity: 34.72,

      u_current: 0.12,
      v_current: -0.08
    }
  },

  {
    id: "ARGO-003",

    type: "Argo Float",

    latitude: 12.5,
    longitude: 78.0,

    depth: 1500,

    status: "Active",

    measurements: {
      temperature: 18.92,
      salinity: 34.81,

      u_current: 0.06,
      v_current: -0.14
    }
  },

  {
    id: "ARGO-004",

    type: "Argo Float",

    latitude: 21.0,
    longitude: 69.5,

    depth: 500,

    status: "Active",

    measurements: {
      temperature: 26.42,
      salinity: 34.59,

      u_current: 0.15,
      v_current: -0.05
    }
  },

  {
    id: "ARGO-005",

    type: "Argo Float",

    latitude: 8.5,
    longitude: 82.0,

    depth: 2500,

    status: "Active",

    measurements: {
      temperature: 11.84,
      salinity: 34.91,

      u_current: 0.04,
      v_current: -0.11
    }
  }
];

/*
 * Return all instruments.
 */
export function getAllInstruments() {
  return instrumentData;
}

/*
 * Find one instrument by ID.
 */
export function getInstrumentById(id) {
  return instrumentData.find(
    instrument => instrument.id === id
  ) ?? null;
}