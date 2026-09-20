export class EventBus {
  constructor() {
    this.listeners = {};
  }
  
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }
  
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(cb => cb(data));
    }
  }
}

export const eventBus = new EventBus();

// Listen for Person 3 (Dashboard) events
eventBus.on('depthChanged', ({ depthIndex }) => {
  console.log('📊 Dashboard: depth changed to index', depthIndex);
});

eventBus.on('timeChanged', ({ timestamp }) => {
  console.log('📊 Dashboard: time changed to', timestamp);
});

eventBus.on('colorbarChanged', ({ variable, scale }) => {
  console.log(`📊 Dashboard: colorbar ${variable} (${scale})`);
});

// Track current variable
let currentVariable = 'temperature';

// Listen for variable changes from Person 3 (Dashboard)
eventBus.on('colorbarChanged', ({ variable, scale }) => {
  console.log(`📊 Changing to ${variable}`);
  currentVariable = variable;
  
  const { minVal, maxVal } = renderOceanVolumeMultiVariable(
    oceanScene, 
    mockData, 
    0,  // Start at surface
    variable
  );
  
  colorbar.update(minVal, maxVal);
});

// Expose for testing
window.currentVariable = currentVariable;