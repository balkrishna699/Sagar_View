import { getCSS, DEFAULT_COLORMAP } from './colormaps.js';

export class Colorbar {
  constructor(container) {
    this.currentColormap = DEFAULT_COLORMAP;

    const wrapper = document.createElement('div');
    wrapper.className = 'ctrl-panel';
    wrapper.style.cssText = `
      top: 74px; right: 16px;
      display: flex; align-items: stretch; gap: 6px;
      padding: 10px 12px;
      min-height: 200px;
    `;

    this.varNameLabel = document.createElement('div');
    this.varNameLabel.style.cssText = `
      position: absolute; top: -22px; left: 0; right: 0;
      font-size: 11px; font-weight: 600; letter-spacing: 0.8px;
      color: #6ea8d4; text-transform: uppercase; white-space: nowrap;
    `;
    this.varNameLabel.textContent = 'TEMPERATURE';
    wrapper.style.position = wrapper.style.position || 'absolute';
    wrapper.appendChild(this.varNameLabel);

    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 180;
    canvas.style.borderRadius = '3px';

    // Label column
    this.labelDiv = document.createElement('div');
    this.labelDiv.style.cssText = `
      display: flex; flex-direction: column; justify-content: space-between;
      font-size: 11px; color: #a0c4df; min-width: 36px;
      font-family: 'Inter', monospace;
    `;

    this.maxLabel = document.createElement('span');
    this.minLabel = document.createElement('span');
    this.unitLabel = document.createElement('span');
    this.unitLabel.style.cssText = 'font-size: 9px; color: #5a7a94; text-align: center; margin-top: 6px;';
    this.unitLabel.textContent = '°C';

    this.maxLabel.style.textAlign = 'right';
    this.minLabel.style.textAlign = 'right';
    this.labelDiv.appendChild(this.maxLabel);
    this.labelDiv.appendChild(this.unitLabel);
    this.labelDiv.appendChild(this.minLabel);

    wrapper.appendChild(canvas);
    wrapper.appendChild(this.labelDiv);
    container.appendChild(wrapper);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minValue = 0;
    this.maxValue = 32;

    this.draw();
  }

  update(minValue, maxValue, unit = '°C', variableName) {
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.unitLabel.textContent = unit;
    if (variableName) {
      this.varNameLabel.textContent = variableName.toUpperCase();
    }
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

    // Draw gradient using the active colormap
    for (let i = 0; i < canvas.height; i++) {
      const t = 1 - i / canvas.height;   // top = max, bottom = min
      ctx.fillStyle = getCSS(t, currentColormap);
      ctx.fillRect(0, i, canvas.width, 1);
    }

    // Update HTML labels
    this.maxLabel.textContent = this.maxValue.toFixed(1);
    this.minLabel.textContent = this.minValue.toFixed(1);
  }
}