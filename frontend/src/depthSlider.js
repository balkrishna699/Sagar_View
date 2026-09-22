import { setVerticalExaggeration, getVerticalExaggeration } from './coordinates.js';
import { eventBus } from './eventBus.js';

export class DepthSlider {
  constructor(container, grid, onDepthChange) {
    this.onDepthChange = onDepthChange;
    this.grid = grid;
    const maxDepthIndex = grid.depth.length - 1;

    const panel = document.createElement('div');
    panel.className = 'ctrl-panel';
    panel.style.cssText = 'bottom: 16px; left: 50%; transform: translateX(-50%); min-width: 340px;';
    panel.innerHTML = `
      <label>
        Depth: <span id="depthValueLabel" style="color: #c8dae8; font-weight: 400; text-transform: none;">${grid.depth[0]}</span>m
      </label>
      <input type="range" id="depthSlider" min="0" max="${maxDepthIndex}" value="0"
             style="margin-bottom: 12px;">

      <label>
        Z Exaggeration: <span id="exagLabel" style="color: #c8dae8; font-weight: 400; text-transform: none;">${getVerticalExaggeration().toFixed(1)}×</span>
      </label>
      <input type="range" id="exagSlider" min="1" max="50" value="${getVerticalExaggeration() * 10}" step="1">
    `;

    container.appendChild(panel);

    // Depth slider
    document.getElementById('depthSlider').addEventListener('input', (e) => {
      const depthIndex = parseInt(e.target.value);
      const depthMeters = this.grid.depth[depthIndex] ?? depthIndex * 50;
      document.getElementById('depthValueLabel').textContent = depthMeters;

      if (this.onDepthChange) {
        this.onDepthChange(depthIndex);
      }
    });

    // Vertical exaggeration slider
    document.getElementById('exagSlider').addEventListener('input', (e) => {
      const factor = parseInt(e.target.value) / 10;
      setVerticalExaggeration(factor);
      document.getElementById('exagLabel').textContent = `${factor.toFixed(1)}×`;

      // Re-render at current depth
      const currentDepthIndex = parseInt(document.getElementById('depthSlider').value);
      eventBus.emit('exaggerationChanged', { factor });

      if (this.onDepthChange) {
        this.onDepthChange(currentDepthIndex);
      }
    });
  }
}