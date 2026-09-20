export class TimeControls {
  constructor(container, timeSeriesManager) {
    const html = `
      <div style="position: absolute; top: 20px; left: 20px; 
                  background: white; padding: 16px; border-radius: 8px; 
                  box-shadow: 0 2px 12px rgba(0,0,0,0.15); z-index: 100;">
        <label style="display: block; margin-bottom: 10px; font-size: 14px; font-weight: 600;">
          Time: <span id="timeLabel">--:--</span>
        </label>
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <button id="playBtn" style="padding: 8px 12px; background: #2a78d6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ▶ Play
          </button>
          <button id="pauseBtn" style="padding: 8px 12px; background: #888; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ⏸ Pause
          </button>
          <button id="resetBtn" style="padding: 8px 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ↺ Reset
          </button>
        </div>
        <input type="range" id="timeScrubber" min="0" max="9" value="0" 
               style="width: 200px; cursor: pointer;">
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    
    // Wire up buttons
    document.getElementById('playBtn').addEventListener('click', () => {
      timeSeriesManager.play();
      console.log('⏱️ Playing...');
    });
    
    document.getElementById('pauseBtn').addEventListener('click', () => {
      timeSeriesManager.pause();
      console.log('⏱️ Paused');
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      timeSeriesManager.jumpToIndex(0);
      document.getElementById('timeScrubber').value = 0;
    });
    
    // Scrubber
    document.getElementById('timeScrubber').addEventListener('input', (e) => {
      timeSeriesManager.pause();
      const data = timeSeriesManager.jumpToIndex(parseInt(e.target.value));
      document.getElementById('timeLabel').textContent = new Date(data.time).toLocaleTimeString();
    });
    
    // Update label on time change
    window.addEventListener('timeIndexChanged', (e) => {
      document.getElementById('timeLabel').textContent = 
        new Date(e.detail.timestamp).toLocaleTimeString();
      document.getElementById('timeScrubber').value = e.detail.timeIndex;
    });
  }
}