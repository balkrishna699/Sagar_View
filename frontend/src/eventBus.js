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
      this.listeners[eventName].forEach((cb) => cb(data));
    }
  }
}

export const eventBus = new EventBus();

// Lightweight dashboard hooks for UI integrations.
eventBus.on('depthChanged', ({ depthIndex }) => {
  console.log('📊 Dashboard: depth changed to index', depthIndex);
});

eventBus.on('timeChanged', ({ timestamp }) => {
  console.log('📊 Dashboard: time changed to', timestamp);
});

eventBus.on('colorbarChanged', ({ variable, scale }) => {
  console.log(`📊 Dashboard: colorbar ${variable} (${scale})`);
});