/**
 * Manage time-series data and animation
 */
export class TimeSeriesManager {
  constructor(mockData) {
    this.timesteps = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.speed = 1;  // Timesteps per second
    this._lastDispatchedIndex = -1;

    // For demo, duplicate mock data with slight variations
    this.generateMockTimeSeries(mockData);
  }

  generateMockTimeSeries(baseData) {
    // Create 10 timesteps with slight temperature variations
    for (let t = 0; t < 10; t++) {
      const tempData = JSON.parse(JSON.stringify(baseData));

      // Vary temperature slightly over time
      tempData.temperature = tempData.temperature.map(depthLayer =>
        depthLayer.map(latRow =>
          latRow.map(temp => temp + Math.sin(t / 10) * 2)  // ±2°C variation
        )
      );

      tempData.time = new Date(
        new Date(baseData.time).getTime() + t * 6 * 3600000  // 6-hour steps
      ).toISOString();

      this.timesteps.push(tempData);
    }

    console.log(`✅ Generated ${this.timesteps.length} timesteps`);
  }

  getDataAtIndex(index) {
    return this.timesteps[Math.max(0, Math.min(index, this.timesteps.length - 1))];
  }

  getCurrentData() {
    return this.getDataAtIndex(this.currentIndex);
  }

  jumpToIndex(index) {
    this.currentIndex = Math.max(0, Math.min(index, this.timesteps.length - 1));
    this._lastDispatchedIndex = -1;  // force dispatch on next animate tick
    console.log(`⏱️ Time: ${this.getCurrentData().time}`);
    return this.getCurrentData();
  }

  play() {
    this.isPlaying = true;
    this._lastTime = performance.now();
    this.animate();
  }

  pause() {
    this.isPlaying = false;
  }

  animate() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = (now - this._lastTime) / 1000;  // seconds since last frame
    this._lastTime = now;

    this.currentIndex += this.speed * dt;

    if (this.currentIndex >= this.timesteps.length - 1) {
      this.currentIndex = 0;  // Loop back
    }

    const displayIndex = Math.floor(this.currentIndex);

    // Only dispatch event when the discrete index actually changes
    if (displayIndex !== this._lastDispatchedIndex) {
      this._lastDispatchedIndex = displayIndex;
      window.dispatchEvent(new CustomEvent('timeIndexChanged', {
        detail: {
          timeIndex: displayIndex,
          timestamp: this.timesteps[displayIndex].time
        }
      }));
    }

    requestAnimationFrame(() => this.animate());
  }
}