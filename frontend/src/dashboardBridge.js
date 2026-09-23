import { eventBus } from './eventBus.js';
import { fetchOceanData } from './api.js';
import { renderOceanVolumeMultiVariable, updateClippingPlanes } from './renderer.js';
import { setState, getState } from './sceneState.js';

/**
 * Bridge between dashboard UI events (Person 3) and the 3D renderer (Person 1).
 * Listens to eventBus and triggers re-renders / API calls as needed.
 *
 * @param {OceanScene}  oceanScene
 * @param {object}      initialData
 * @param {Function}    renderFn — renderOceanVolume
 * @param {Colorbar}    colorbar — colorbar instance for variable/colormap updates
 */
export function setupDashboardBridge(oceanScene, initialData, renderFn, colorbar) {
  let currentData = initialData;

  const VARIABLE_UNITS = {
    temperature: '°C',
    salinity: 'PSU',
  };

  // ── Depth changes from Person 3's slider ──
  eventBus.on('depthChanged', ({ depthIndex }) => {
    console.log('📊 Bridge: depth →', depthIndex);
    const { currentVariable, currentColormap } = getState();
    renderOceanVolumeMultiVariable(oceanScene, currentData, depthIndex, currentVariable, currentColormap);
  });

  // ── Time changes — refetch from backend if available ──
  eventBus.on('timeChanged', async ({ timeIndex, timestamp }) => {
    console.log('📊 Bridge: time →', timestamp);

    // Try fetching real data for this timestamp from Person 5's API
    try {
      const data = await fetchOceanData({ time: timestamp });
      if (data && data.grid && data.temperature) {
        currentData = data;
        const { currentVariable, currentColormap, currentDepthIndex } = getState();
        renderOceanVolumeMultiVariable(oceanScene, currentData, currentDepthIndex, currentVariable, currentColormap);
        setState({ dataSource: 'api' });
        console.log('📊 Bridge: re-rendered with API data for', timestamp);
        return;
      }
    } catch (_) {
      // Backend not available or doesn't support ?time= yet — no-op
    }

    // Fallback: the local TimeSeriesManager already updated currentData
    // via the timeIndexChanged listener in main.js, so nothing extra needed here.
  });

  // ── Variable / colormap changes (fully wired for Person 3) ──
  eventBus.on('colorbarChanged', ({ variable, colormap, scale }) => {
    console.log(`📊 Bridge: variable=${variable}, colormap=${colormap}, scale=${scale}`);

    const depthIndex = getState().currentDepthIndex;

    // Re-render with new variable and colormap
    const result = renderOceanVolumeMultiVariable(oceanScene, currentData, depthIndex, variable, colormap);

    // Update colorbar to match
    if (colorbar && result) {
      const unit = VARIABLE_UNITS[variable] || '';
      colorbar.update(result.minVal, result.maxVal, unit);
      colorbar.setColormap(colormap);
    }
  });

  // ── Vertical exaggeration changes ──
  eventBus.on('exaggerationChanged', ({ factor }) => {
    console.log(`📊 Bridge: exaggeration=${factor}`);
    const { currentVariable, currentColormap, currentDepthIndex } = getState();
    renderOceanVolumeMultiVariable(oceanScene, currentData, currentDepthIndex, currentVariable, currentColormap);
  });

  // ── Cross Section changes ──
  eventBus.on('crossSectionChanged', ({ clipX, clipY, clipZ }) => {
    updateClippingPlanes(clipX, clipY, clipZ);
  });

  // ── Expose current data getter for other modules ──
  return {
    getCurrentData: () => currentData,
    setData: (data) => { currentData = data; },
  };
}