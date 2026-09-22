export class Colorbar {
  constructor(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ctrl-panel';
    wrapper.style.cssText = `
      top: 52px; right: 16px;
      display: flex; align-items: stretch; gap: 6px;
      padding: 10px 12px;
      min-height: 200px;
    `;

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

  update(minValue, maxValue, unit = '°C') {
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.unitLabel.textContent = unit;
    this.draw();
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient: top = warm (red), bottom = cold (blue)
    for (let i = 0; i < canvas.height; i++) {
      const normalized = 1 - i / canvas.height;
      const hue = 0.66 * (1 - normalized);
      ctx.fillStyle = `hsl(${hue * 360}, 85%, 50%)`;
      ctx.fillRect(0, i, canvas.width, 1);
    }

    // Update HTML labels
    this.maxLabel.textContent = this.maxValue.toFixed(1);
    this.minLabel.textContent = this.minValue.toFixed(1);
  }
}