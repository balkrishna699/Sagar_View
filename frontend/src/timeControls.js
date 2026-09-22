export class TimeControls {
  constructor(container, timeSeriesManager) {
    const panel = document.createElement('div');
    panel.className = 'ctrl-panel';
    panel.style.cssText = 'top: 52px; left: 16px; min-width: 220px;';
    panel.innerHTML = `
      <label>
        Time: <span id="timeLabel" style="color: #c8dae8; font-weight: 400; text-transform: none; letter-spacing: 0;">--:--</span>
      </label>
      <div style="display: flex; gap: 6px; margin-bottom: 10px;">
        <button id="playBtn">▶ Play</button>
        <button id="pauseBtn">⏸ Pause</button>
        <button id="resetBtn">↺ Reset</button>
      </div>
      <input type="range" id="timeScrubber" min="0" max="${timeSeriesManager.timesteps.length - 1}" value="0">
    `;

    container.appendChild(panel);

    // Wire up buttons
    document.getElementById('playBtn').addEventListener('click', () => {
      timeSeriesManager.play();
      document.getElementById('playBtn').classList.add('active');
      document.getElementById('pauseBtn').classList.remove('active');
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
      timeSeriesManager.pause();
      document.getElementById('pauseBtn').classList.add('active');
      document.getElementById('playBtn').classList.remove('active');
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      timeSeriesManager.pause();
      timeSeriesManager.jumpToIndex(0);
      document.getElementById('timeScrubber').value = 0;
      document.getElementById('playBtn').classList.remove('active');
      document.getElementById('pauseBtn').classList.remove('active');
      const data = timeSeriesManager.getCurrentData();
      document.getElementById('timeLabel').textContent = new Date(data.time).toLocaleTimeString();
    });

    // Scrubber
    document.getElementById('timeScrubber').addEventListener('input', (e) => {
      timeSeriesManager.pause();
      const data = timeSeriesManager.jumpToIndex(parseInt(e.target.value));
      document.getElementById('timeLabel').textContent = new Date(data.time).toLocaleTimeString();
      document.getElementById('playBtn').classList.remove('active');
      document.getElementById('pauseBtn').classList.remove('active');
    });

    // Update label on time change
    window.addEventListener('timeIndexChanged', (e) => {
      document.getElementById('timeLabel').textContent =
        new Date(e.detail.timestamp).toLocaleTimeString();
      document.getElementById('timeScrubber').value = e.detail.timeIndex;
    });

    // Show initial time
    const initData = timeSeriesManager.getCurrentData();
    if (initData?.time) {
      document.getElementById('timeLabel').textContent = new Date(initData.time).toLocaleTimeString();
    }
  }
}