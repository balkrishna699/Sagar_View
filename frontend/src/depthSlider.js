export class DepthSlider {
  constructor(container, maxDepthIndex, onDepthChange) {
    this.onDepthChange = onDepthChange;
    this.maxDepthIndex = maxDepthIndex;
    
    const html = `
      <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); 
                  background: white; padding: 16px; border-radius: 8px; 
                  box-shadow: 0 2px 12px rgba(0,0,0,0.15); z-index: 100; min-width: 300px;">
        <label style="display: block; margin-bottom: 10px; font-size: 14px; font-weight: 600; color: #0b0b0b;">
          Depth: <span id="depthValueLabel">0</span>m
        </label>
        <input type="range" id="depthSlider" min="0" max="${maxDepthIndex}" value="0" 
               style="width: 100%; cursor: pointer; height: 6px;">
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    
    document.getElementById('depthSlider').addEventListener('input', (e) => {
      const depthIndex = parseInt(e.target.value);
      // Assume 50m per step (adjust based on your grid.depth)
      document.getElementById('depthValueLabel').textContent = depthIndex * 50;
      
      if (this.onDepthChange) {
        this.onDepthChange(depthIndex);
      }
    });
  }
}