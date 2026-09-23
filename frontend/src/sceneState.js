import { eventBus } from './eventBus.js';
import { getVerticalExaggeration } from './coordinates.js';
import { DEFAULT_COLORMAP, getColormapNames } from './colormaps.js';

/**
 * Centralized observable scene state.
 *
 * Person 3's dashboard reads and writes state through this module.
 * Person 1's renderer and Person 2's overlays react to state changes
 * via the eventBus events emitted here.
 *
 * State shape:
 *   currentVariable   — "temperature" | "salinity"
 *   currentColormap   — one of getColormapNames()
 *   currentDepthIndex — integer index into grid.depth[]
 *   currentTimeIndex  — integer index into timesteps[]
 *   exaggeration      — float 1.0–5.0
 *   cameraPosition    — { x, y, z }  (read-only, updated each frame)
 *   isLoading         — boolean
 *   dataSource        — "api" | "mock"
 */

const state = {
  currentVariable:   'temperature',
  currentColormap:   DEFAULT_COLORMAP,
  currentDepthIndex: 0,
  currentTimeIndex:  0,
  exaggeration:      getVerticalExaggeration(),
  cameraPosition:    { x: 0, y: 0, z: 0 },
  isLoading:         false,
  dataSource:        'mock',
  clipX:             100, // 0-100 percentage
  clipY:             100,
  clipZ:             100,
};

/**
 * Get a shallow copy of the current state.
 * @returns {object}
 */
export function getState() {
  return { ...state };
}

/**
 * Update one or more state fields and emit change events.
 *
 * @param {object} patch — partial state update
 */
export function setState(patch) {
  const changed = [];

  for (const [key, value] of Object.entries(patch)) {
    if (key in state && state[key] !== value) {
      state[key] = value;
      changed.push(key);
    }
  }

  if (changed.length > 0) {
    eventBus.emit('stateChanged', { changed, state: getState() });

    // Emit specific events for backward compat with existing listeners
    if (changed.includes('currentVariable') || changed.includes('currentColormap')) {
      eventBus.emit('colorbarChanged', {
        variable: state.currentVariable,
        colormap: state.currentColormap,
        scale: 'linear',
      });
    }

    if (changed.includes('currentDepthIndex')) {
      eventBus.emit('depthChanged', { depthIndex: state.currentDepthIndex });
    }

    if (changed.includes('exaggeration')) {
      eventBus.emit('exaggerationChanged', { factor: state.exaggeration });
    }

    if (changed.includes('isLoading')) {
      eventBus.emit('loadingChanged', { isLoading: state.isLoading });
    }

    if (changed.includes('clipX') || changed.includes('clipY') || changed.includes('clipZ')) {
      eventBus.emit('crossSectionChanged', { 
        clipX: state.clipX, 
        clipY: state.clipY, 
        clipZ: state.clipZ 
      });
    }
  }
}

/**
 * Update camera position (called from render loop, no event emitted).
 * @param {THREE.Camera} camera
 */
export function updateCameraPosition(camera) {
  if (camera) {
    state.cameraPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };
  }
}

/**
 * Get available colormaps and variables for Person 3's UI.
 */
export function getAvailableOptions() {
  return {
    variables: ['temperature', 'salinity'],
    colormaps: getColormapNames(),
    variableUnits: {
      temperature: '°C',
      salinity: 'PSU',
    },
  };
}
