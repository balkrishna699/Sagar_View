import { getCSS, DEFAULT_COLORMAP } from './colormaps.js';

export class Colorbar {
  constructor(container) {
    this.currentColormap = DEFAULT_COLORMAP;

    const wrapper = document.createElement('div');
    wrapper.className = 'ctrl-panel colorbar-horizontal';
    wrapper.style.cssText = `
      bottom: 24px; right: 24px; top: auto; left: auto; transform: none;
      display: flex; flex-direction: column; align-items: stretch; gap: 8px;
      padding: 16px 24px;
      width: 400px;
    `;

    // Header row (Title/Unit)
    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display: flex; justify-content: center; margin-bottom: 4px;';
    
    this.unitLabel = document.createElement('span');
    this.unitLabel.style.cssText = 'font-size: 12px; color: #00f0ff; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-shadow: 0 0 8px rgba(0,240,255,0.4);';
    this.unitLabel.textContent = 'Temperature (°C)';
    headerRow.appendChild(this.unitLabel);

    const canvas = document.createElement('canvas');
    canvas.width = 350;
    canvas.height = 16;
    canvas.style.borderRadius = '2px';
    canvas.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)';
    canvas.style.border = '1px solid rgba(0,240,255,0.3)';

    // Label row
    this.labelDiv = document.createElement('div');
    this.labelDiv.style.cssText = `
      display: flex; flex-direction: row; justify-content: space-between;
      font-size: 12px; color: #e0f2fe;
      font-family: 'Inter', monospace; font-weight: 600;
      margin-top: 2px;
    `;

    this.minLabel = document.createElement('span');
    this.midLabel = document.createElement('span');
    this.maxLabel = document.createElement('span');

    this.labelDiv.appendChild(this.minLabel);
    this.labelDiv.appendChild(this.midLabel);
    this.labelDiv.appendChild(this.maxLabel);

    wrapper.appendChild(headerRow);
    wrapper.appendChild(canvas);
    wrapper.appendChild(this.labelDiv);
    container.appendChild(wrapper);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minValue = 0;
    this.maxValue = 32;

    this.draw();
  }

  update(minValue, maxValue, unit = 'Temperature (°C)') {
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.unitLabel.textContent = unit;
    this.draw();
  }

  /**
   * Switch to a different colormap and redraw.
   * @param {string} colormapName
   */
  setColormap(colormapName) {
    this.currentColormap = colormapName;
    this.draw();
  }

  draw() {
    const { ctx, canvas, currentColormap } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gradient horizontally
    for (let i = 0; i < canvas.width; i++) {
      const t = i / canvas.width;   // left = min, right = max
      ctx.fillStyle = getCSS(t, currentColormap);
      ctx.fillRect(i, 0, 1, canvas.height);
    }

    // Update HTML labels
    this.minLabel.textContent = this.minValue.toFixed(1);
    this.midLabel.textContent = ((this.minValue + this.maxValue) / 2).toFixed(1);
    this.maxLabel.textContent = this.maxValue.toFixed(1);
  }
}