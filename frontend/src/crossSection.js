import { setState, getState } from './sceneState.js';

export class CrossSectionTool {
  constructor(container) {
    const { clipX, clipY, clipZ } = getState();

    const panel = document.createElement('div');
    panel.className = 'ctrl-panel';
    // Positioned in upper right corner
    panel.style.cssText = 'top: 16px; right: 16px; min-width: 200px; display: flex; flex-direction: column; gap: 12px;';
    
    panel.innerHTML = `
      <div style="font-weight: 600; color: #fff; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
        CROSS SECTION
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <label>Lon Slice (X)</label>
          <span id="lblClipX">${clipX}%</span>
        </div>
        <input type="range" id="clipX" min="0" max="100" value="${clipX}" style="width: 100%;">
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <label>Depth Slice (Y)</label>
          <span id="lblClipY">${clipY}%</span>
        </div>
        <input type="range" id="clipY" min="0" max="100" value="${clipY}" style="width: 100%;">
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <label>Lat Slice (Z)</label>
          <span id="lblClipZ">${clipZ}%</span>
        </div>
        <input type="range" id="clipZ" min="0" max="100" value="${clipZ}" style="width: 100%;">
      </div>
    `;
    container.appendChild(panel);

    const bindSlider = (id, stateKey, lblId) => {
      const slider = panel.querySelector(`#${id}`);
      const lbl = panel.querySelector(`#${lblId}`);
      
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        lbl.innerText = val + '%';
        setState({ [stateKey]: val });
      });
    };

    bindSlider('clipX', 'clipX', 'lblClipX');
    bindSlider('clipY', 'clipY', 'lblClipY');
    bindSlider('clipZ', 'clipZ', 'lblClipZ');
  }
}
