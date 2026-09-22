import { eventBus } from './eventBus.js';
import { fetchOceanData } from './api.js';

/**
 * Bridge between dashboard UI events (Person 3) and the 3D renderer (Person 1).
 * Listens to eventBus and triggers re-renders / API calls as needed.
 */
export function setupDashboardBridge(oceanScene, initialData, renderFn) {
  let currentData = initialData;

  // ── Depth changes from Person 3's slider ──
  eventBus.on('depthChanged', ({ depthIndex }) => {
    console.log('📊 Bridge: depth →', depthIndex);
    renderFn(oceanScene, currentData, depthIndex);
  });

  // ── Time changes — refetch from backend if available ──
  eventBus.on('timeChanged', async ({ timeIndex, timestamp }) => {
    console.log('📊 Bridge: time →', timestamp);

    // Try fetching real data for this timestamp from Person 5's API
    try {
      const data = await fetchOceanData({ time: timestamp });
      if (data && data.grid && data.temperature) {
        currentData = data;
        renderFn(oceanScene, currentData, 0);
        console.log('📊 Bridge: re-rendered with API data for', timestamp);
        return;
      }
    } catch (_) {
      // Backend not available or doesn't support ?time= yet — no-op
    }

    // Fallback: the local TimeSeriesManager already updated currentData
    // via the timeIndexChanged listener in main.js, so nothing extra needed here.
  });

  // ── Variable / colorbar changes ──
  eventBus.on('colorbarChanged', ({ variable, scale }) => {
    console.log(`📊 Bridge: variable=${variable}, scale=${scale}`);
    // Will hook into renderOceanVolumeMultiVariable when Person 3 adds variable toggle
  });

  // ── Expose current data getter for other modules ──
  return {
    getCurrentData: () => currentData,
    setData: (data) => { currentData = data; },
  };
}