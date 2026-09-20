export class Colorbar {
  constructor(container) {
    const canvas = document.createElement('canvas');
    canvas.width = 30;
    canvas.height = 200;
    canvas.style.cssText = `
      position: absolute; top: 20px; right: 20px; z-index: 100;
      border: 1px solid #ccc; border-radius: 4px; background: white;
    `;
    
    container.appendChild(canvas);
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minValue = 0;
    this.maxValue = 32;
    
    this.draw();
  }
  
  update(minValue, maxValue) {
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.draw();
  }
  
  draw() {
    const { ctx, canvas } = this;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gradient: blue → red
    for (let i = 0; i < canvas.height; i++) {
      const normalized = 1 - (i / canvas.height);
      const hue = 0.66 * normalized;
      ctx.fillStyle = `hsl(${hue * 360}, 100%, 50%)`;
      ctx.fillRect(0, i, canvas.width, 1);
    }
    
    // Labels
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(this.maxValue.toFixed(1), canvas.width + 5, 12);
    ctx.fillText(this.minValue.toFixed(1), canvas.width + 5, canvas.height);
  }
}