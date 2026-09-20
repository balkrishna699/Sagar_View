import { eventBus } from './eventBus.js';
import { renderOceanVolume } from './renderer.js';

export function setupDashboardBridge(oceanScene, oceanData, renderFn) {
  // Listen for depth changes from Person 3
  eventBus.on('depthChanged', ({ depthIndex }) => {
    console.log('📊 Dashboard: depth changed to', depthIndex);
    renderFn(oceanScene, oceanData, depthIndex);
  });
  
  // Listen for time changes
  eventBus.on('timeChanged', ({ timestamp }) => {
    console.log('📊 Dashboard: time changed to', timestamp);
    // When Person 5 provides real data, fetch here
  });
  
  // Listen for colorbar changes
  eventBus.on('colorbarChanged', ({ variable, scale }) => {
    console.log(`📊 Dashboard: ${variable} (${scale} scale)`);
    // Update rendering if needed
  });
}